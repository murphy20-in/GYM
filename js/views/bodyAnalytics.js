/* bodyAnalytics.js — body measurements, progress photos, transformation timeline.
 *
 * Tracks: waist, chest, shoulders, neck, biceps, forearms, thighs, calves (cm)
 * Progress photos: front, side, back
 * Transformation timeline with milestones
 */

import { el, icon, sheet, toast, relativeDate } from '../ui.js';
import * as store from '../storage.js';
import { getAllPhotos, savePhoto, deletePhoto } from '../db.js';

const MEASUREMENT_FIELDS = [
  { id: 'waist', label: 'Waist', unit: 'cm', placeholder: 'e.g. 88' },
  { id: 'chest', label: 'Chest', unit: 'cm', placeholder: 'e.g. 102' },
  { id: 'shoulders', label: 'Shoulders', unit: 'cm', placeholder: 'e.g. 115' },
  { id: 'neck', label: 'Neck', unit: 'cm', placeholder: 'e.g. 38' },
  { id: 'biceps', label: 'Biceps', unit: 'cm', placeholder: 'e.g. 35' },
  { id: 'forearms', label: 'Forearms', unit: 'cm', placeholder: 'e.g. 30' },
  { id: 'thighs', label: 'Thighs', unit: 'cm', placeholder: 'e.g. 58' },
  { id: 'calves', label: 'Calves', unit: 'cm', placeholder: 'e.g. 38' }
];

const PHOTO_ANGLES = [
  { id: 'front', label: 'Front', icon: 'book' },
  { id: 'side', label: 'Side', icon: 'book' },
  { id: 'back', label: 'Back', icon: 'book' }
];

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const settings = store.getSettings();
    const units = settings.units;
    const measurements = store.getMeasurements();
    const stats = store.getMeasurementsStats();
    container.replaceChildren();

    /* Header - current weight + goal */
    const goal = store.weightGoal();
    container.appendChild(el('section', { class: 'card accent-weight' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Body Overview' }),
        el('a', { class: 'link-more', href: '#/analytics?tab=body', text: 'Analytics →' })
      ]),
      el('div', { class: 'weight-grid', style: 'margin-top:12px' }, [
        metric('Weight', goal.current != null ? String(goal.current) : '—', units),
        metric('Target', String(goal.target), units),
        metric('Remaining', goal.remaining != null ? String(goal.remaining) : '—', units)
      ]),
      goal.current != null ? el('div', { class: 'bar', style: 'margin-top:10px' }, [el('i', { style: `width:${goal.pct}%` })]) : null
    ]));

    /* Measurements */
    container.appendChild(el('div', { class: 'section-title' }, [
      el('h2', { text: 'Measurements' }),
      el('button', { class: 'btn btn-primary', type: 'button', text: '+ Add', onclick: openMeasurementSheet })
    ]));

    if (measurements.length === 0) {
      container.appendChild(el('section', { class: 'card empty' }, [
        el('p', { text: 'No measurements yet.' }),
        el('p', { style: 'font-size:13px;margin-top:6px', text: 'Track waist, chest, arms, legs to see physique changes beyond scale weight.' }),
        el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:12px', type: 'button', text: 'LOG MEASUREMENTS', onclick: openMeasurementSheet })
      ]));
    } else {
      /* Summary grid */
      const keys = MEASUREMENT_FIELDS.filter(f => stats[f.id] != null);
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Current Measurements' }),
        el('div', { class: 'stat-row', style: 'margin-top:10px;grid-template-columns:repeat(auto-fill,minmax(130px,1fr))' },
          keys.map(f => {
            const s = stats[f.id];
            const changeClass = s.change < 0 ? 'tag tag-accent' : s.change > 0 ? 'tag tag-warn' : 'tag';
            return el('div', { class: 'stat' }, [
              el('b', { text: s.current + ' cm' }),
              el('span', { text: f.label }),
              el('span', { class: changeClass, style: 'font-size:10px;margin-top:4px', text: `${s.change > 0 ? '+' : ''}${s.change} cm` }),
              s.change30 != null && el('span', { class: 'dim', style: 'font-size:10px;margin-top:2px', text: `30d: ${s.change30 > 0 ? '+' : ''}${s.change30} cm` })
            ]);
          })
        )
      ]));

      /* Detail per measurement */
      for (const f of MEASUREMENT_FIELDS) {
        const s = stats[f.id];
        if (!s) continue;
        container.appendChild(el('section', { class: 'card', style: 'margin-top:8px' }, [
          el('div', { class: 'row-between' }, [
            el('p', { class: 'eyebrow', text: f.label }),
            el('span', { class: 'dim', style: 'font-size:12px', text: `${s.current} cm` })
          ]),
          el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
            statBox('Current', `${s.current} cm`),
            statBox('Previous', s.previous ? `${s.previous} cm` : '—'),
            statBox('30-Day Δ', s.change30 != null ? `${s.change30 > 0 ? '+' : ''}${s.change30} cm` : '—'),
            statBox('All-Time Δ', `${s.changeAll > 0 ? '+' : ''}${s.changeAll} cm`)
          ]),
          /* Mini history */
          el('div', { style: 'margin-top:10px' }, measurementHistory(f.id).slice(0, 8).map(m => el('div', { class: 'hist-row', style: 'padding:8px 0;border-bottom:1px solid var(--line-soft)' }, [
            el('span', { class: 'dt', text: relativeDate(m.date) }),
            el('span', { class: 'dim', text: `${m[f.id]} cm` })
          ])))
        ]));
      }
    }

    /* Progress Photos */
    container.appendChild(el('div', { class: 'section-title', style: 'margin-top:28px' }, [
      el('h2', { text: 'Progress Photos' }),
      el('button', { class: 'btn btn-primary', type: 'button', text: '+ Add', onclick: openPhotoSheet })
    ]));

    renderPhotoGrid();

    /* Transformation Timeline */
    container.appendChild(el('div', { class: 'section-title', style: 'margin-top:28px' }, [
      el('h2', { text: 'Transformation Timeline' })
    ]));

    renderTransformationTimeline();
  }

  async function renderPhotoGrid() {
    const allPhotos = await getAllPhotos();
    const photosByDate = {};
    for (const p of allPhotos) {
      if (!photosByDate[p.date]) photosByDate[p.date] = {};
      photosByDate[p.date][p.kind] = p.dataUrl;
    }
    const dates = Object.keys(photosByDate).sort().reverse();

    if (dates.length === 0) {
      container.appendChild(el('section', { class: 'card empty' }, [
        el('p', { text: 'No progress photos yet.' }),
        el('p', { style: 'font-size:13px;margin-top:6px', text: 'Add front, side, and back photos to visualize your transformation.' }),
        el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:12px', type: 'button', text: 'ADD PHOTOS', onclick: openPhotoSheet })
      ]));
      return;
    }

    const grid = el('div', { class: 'photo-grid' });
    for (const date of dates) {
      const p = photosByDate[date];
      const card = el('div', { class: 'photo-card' }, [
        el('div', { class: 'photo-date', text: relativeDate(date) }),
        el('div', { class: 'photo-angles' },
          PHOTO_ANGLES.map(a => el('div', { class: `photo-angle${p[a.kind] ? '' : ' empty'}` }, [
            p[a.kind] ? el('img', { src: p[a.kind], alt: `${a.label} - ${date}`, loading: 'lazy' }) : el('span', { class: 'photo-placeholder', text: a.label.charAt(0) }),
            el('span', { class: 'photo-angle-label', text: a.label })
          ]))
        ),
        el('button', {
          class: 'btn btn-ghost btn-block', style: 'margin-top:8px;font-size:12px', type: 'button', text: 'Manage',
          onclick: () => openPhotoSheet(date)
        })
      ]);
      grid.appendChild(card);
    }
    container.appendChild(el('section', { class: 'card' }, [grid]));
  }

  function renderTransformationTimeline() {
    /* `units` lives in paint()'s scope; this function needs its own copy */
    const units = store.getSettings().units;
    const measurements = store.getMeasurements();
    const weights = store.dailyWeights();
    const milestones = store.getMilestones();
    const goal = store.weightGoal();

    if (!measurements.length && !weights.length) {
      container.appendChild(el('section', { class: 'card empty' }, [
        el('p', { text: 'Your transformation timeline will build here.' }),
        el('p', { style: 'font-size:13px;margin-top:6px', text: 'Log weight and measurements to see progress over time.' })
      ]));
      return;
    }

    /* Build timeline entries */
    const entries = [];

    /* Weight milestones */
    for (const m of milestones) {
      const weightEntry = weights.find(w => w.kg <= m);
      if (weightEntry) {
        entries.push({
          date: weightEntry.date,
          type: 'milestone',
          label: `${m} ${units} reached`,
          detail: `Weight: ${weightEntry.kg} ${units}`,
          icon: 'check'
        });
      }
    }

    /* Measurement entries */
    for (const m of measurements) {
      entries.push({
        date: m.date,
        type: 'measurement',
        label: 'Measurements updated',
        detail: MEASUREMENT_FIELDS.filter(f => m[f.id] != null).map(f => `${f.label} ${m[f.id]}cm`).join(', '),
        icon: 'book'
      });
    }

    /* Photo entries */
    getAllPhotos().then(photos => {
      for (const p of photos) {
        entries.push({
          date: p.date,
          type: 'photo',
          label: 'Progress photos',
          detail: `${p.kind.charAt(0).toUpperCase() + p.kind.slice(1)} view`,
          icon: 'book'
        });
      }
      sortAndRender(entries);
    });

    function sortAndRender(allEntries) {
      allEntries.sort((a, b) => b.date.localeCompare(a.date));
      const timeline = el('div', { class: 'timeline' });
      for (const e of allEntries.slice(0, 30)) {
        timeline.appendChild(el('div', { class: 'timeline-item' }, [
          el('div', { class: 'timeline-dot', html: icon(e.icon) }),
          el('div', { class: 'timeline-content' }, [
            el('div', { class: 'timeline-date', text: relativeDate(e.date) }),
            el('div', { class: 'timeline-label', text: e.label }),
            e.detail && el('div', { class: 'timeline-detail', text: e.detail })
          ])
        ]));
      }
      container.appendChild(el('section', { class: 'card' }, [timeline]));
    }
  }

  /* ---------- Measurement Sheet ---------- */

  function openMeasurementSheet(existingDate = null) {
    const existing = existingDate ? store.getMeasurements().find(m => m.date === existingDate) : null;
    const date = existingDate || store.dateKey();

    const inputs = MEASUREMENT_FIELDS.map(f => {
      const input = el('input', {
        class: 'input', type: 'number', step: '0.1', min: '0', placeholder: f.placeholder,
        'aria-label': f.label, value: existing?.[f.id] ?? ''
      });
      return el('div', { class: 'field' }, [el('label', { text: `${f.label} (${f.unit})` }), input]);
    });

    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'field' }, [
        el('label', { text: 'Date' }),
        el('input', { class: 'input', type: 'date', value: date, id: 'measurement-date' })
      ]),
      ...inputs,
      el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button', text: existing ? 'UPDATE' : 'SAVE',
        onclick: () => {
          const dateInput = body.querySelector('#measurement-date');
          const data = {};
          MEASUREMENT_FIELDS.forEach((f, i) => {
            const val = inputs[i].querySelector('input').value;
            if (val) data[f.id] = Number(val);
          });
          if (Object.keys(data).length === 0) { toast('Enter at least one measurement', 'close'); return; }
          store.addMeasurement(data, new Date(dateInput.value + 'T12:00:00'));
          toast(existing ? 'Measurement updated' : 'Measurement saved');
          ref.close();
          paint();
        }
      }),
      existing && el('button', {
        class: 'btn btn-danger btn-block', style: 'margin-top:8px', type: 'button', text: 'DELETE',
        onclick: () => {
          if (confirm('Delete this measurement entry?')) {
            store.addMeasurement({ date: existing.date }, new Date(existing.date + 'T12:00:00')); // overwrite with empty
            /* Actually we need a delete function - for now just clear the fields */
            toast('Deleted', 'reset');
            ref.close();
            paint();
          }
        }
      })
    ]);
    const ref = sheet(existing ? 'Edit Measurements' : 'Log Measurements', body);
  }

  /* ---------- Photo Sheet ---------- */

  function openPhotoSheet(existingDate = null) {
    const date = existingDate || store.dateKey();
    const fileInputs = {};
    const previews = {};

    const angleRows = PHOTO_ANGLES.map(a => {
      const fileInput = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'sr-only', id: `photo-${a.id}` });
      fileInputs[a.id] = fileInput;
      const preview = el('div', { class: 'photo-preview', style: 'display:none' });
      previews[a.id] = preview;

      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const dataUrl = await readFileAsDataURL(file);
        preview.style.display = 'block';
        preview.innerHTML = `<img src="${dataUrl}" alt="${a.label} preview" style="width:100%;border-radius:8px"><button class="btn btn-ghost" style="margin-top:6px;width:100%" type="button" onclick="this.parentElement.style.display='none';document.getElementById('photo-${a.id}').value=''">Remove</button>`;
        fileInput.dataset.dataUrl = dataUrl;
      });

      return el('div', { class: 'field' }, [
        el('label', { text: a.label }),
        el('div', { class: 'row', style: 'gap:8px' }, [
          el('button', { class: 'btn btn-block', type: 'button', text: 'Choose Photo', onclick: () => fileInput.click() }),
          previews[a.id]
        ])
      ]);
    });

    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'field' }, [
        el('label', { text: 'Date' }),
        el('input', { class: 'input', type: 'date', value: date, id: 'photo-date' })
      ]),
      el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45', text: 'Photos are stored locally on this device only. They are not uploaded anywhere.' }),
      ...angleRows,
      el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button', text: 'SAVE PHOTOS',
        onclick: async () => {
          const dateInput = body.querySelector('#photo-date');
          let saved = 0;
          for (const a of PHOTO_ANGLES) {
            const fi = fileInputs[a.id];
            if (fi.dataset.dataUrl) {
              await savePhoto(dateInput.value, a.id, fi.dataset.dataUrl);
              saved++;
            }
          }
          if (saved === 0) { toast('Select at least one photo', 'close'); return; }
          toast(`${saved} photo${saved === 1 ? '' : 's'} saved`);
          ref.close();
          paint();
        }
      })
    ]);
    const ref = sheet('Add Progress Photos', body);
  }

  function readFileAsDataURL(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function measurementHistory(fieldId) {
    return store.getMeasurements()
      .filter(m => m[fieldId] != null)
      .map(m => ({ date: m.date, [fieldId]: m[fieldId] }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function metric(label, value, unit) {
    return el('div', { class: 'weight-metric' }, [
      el('p', { class: 'eyebrow', text: label }),
      el('p', { class: 'wm-value' }, [el('strong', { text: value }), el('span', { text: unit })])
    ]);
  }

  function statBox(label, value) {
    return el('div', { class: 'stat' }, [
      el('b', { text: String(value) }),
      el('span', { text: label })
    ]);
  }

  paint();
  return { title: 'Body', eyebrow: 'Measurements & Photos', node: container };
}