import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import step1Img1 from '../../assets/instruction images/step1 (1).png'
import step1Img2 from '../../assets/instruction images/step1 (2).png'
import step2Img from '../../assets/instruction images/step2.png'
import step3Img1 from '../../assets/instruction images/step3 (1).png'
import step3Img2 from '../../assets/instruction images/step3 (2).png'
import step4Img1 from '../../assets/instruction images/step4 (1).png'
import step4Img2 from '../../assets/instruction images/step4 (2).png'
import step4Img3 from '../../assets/instruction images/step4 (3).png'
import step5Img1 from '../../assets/instruction images/step5 (1).png'
import step5Img2 from '../../assets/instruction images/step5 (2).png'

const guideTemplate = [
  {
    number: 1,
    title: 'Step 1',
    description: 'Go to “Invoice Profile”, then click the “Create New Invoice Profile” button to start. Enter the company name and description, then click “Create.” to create the invoice profile.',
    screenshots: [
      { src: step1Img1, alt: 'Step 1 screenshot 1' },
      { src: step1Img2, alt: 'Step 1 screenshot 2' },
    ],
  },
  {
    number: 2,
    title: 'Step 2',
    description: 'After creating an invoice profile, go to the “Sales Invoice” page. Within the selected invoice profile or company, click the “Add Sheet” button on the right side. to add a new sheet, and select a spreadsheet from the dropdown list, then click “Add” to add the sheet to the invoice profile.',
    screenshots: [
      { src: step2Img, alt: 'Step 2 screenshot' },
    ],
  },
  {
    number: 3,
    title: 'Step 3',
    description: 'From the Google Sheets link, copy and paste the specific part of the URL needed, then paste it into the “Spreadsheet ID” field, then click “Create.” to create a new sheet, then click “Add” to add the sheet to the invoice profile.',
    note: 'The image with blue highlighted text shows the specific part of the URL you need to copy and paste into the sales invoice system.',
    screenshots: [
      { src: step3Img2, alt: 'Step 3 screenshot 1' },
      { src: step3Img1, alt: 'Step 3 screenshot 2' },
    ],
  },
  {
    number: 4,
    title: 'Step 4',
    description: 'Click “Create Table Template” to define the columns of the table. Add columns as needed (click “+ Add Row” to add more rows), then click “Create” to finalize the table. After creating the table template, you can click the “View Template” button to view the created table template in a new tab.',
    screenshots: [
      { src: step4Img1, alt: 'Step 4 screenshot 1' },
      { src: step4Img2, alt: 'Step 4 screenshot 2' },
      { src: step4Img3, alt: 'Step 4 screenshot 3' },
    ],
  },
  {
    number: 5,
    title: 'Step 5',
    description: 'Click “Create Invoice” to fill in the table for the selected company and sheet (whether AR or SI). After entering the sales invoice details, click “Save Invoice.” to save the invoice. You can also click “View Invoice” to view the created invoice in a new tab.',
    screenshots: [
      { src: step5Img1, alt: 'Step 5 screenshot 1' },
      { src: step5Img2, alt: 'Step 5 screenshot 2' },
    ],
  },
]

export const UserGuideModal = ({ isOpen, onClose }) => {
  const [openStep, setOpenStep] = useState(1)
  const [activeShot, setActiveShot] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const openZoom = (shot) => {
    setActiveShot((prev) => {
      if (prev && prev.src === shot.src && prev.step === shot.step) {
        setZoomLevel(1)
        return null
      }
      setZoomLevel(1)
      return shot
    })
  }

  const closeZoom = () => {
    setActiveShot(null)
    setZoomLevel(1)
  }

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4))
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 1))
  const zoomReset = () => setZoomLevel(1)

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl rounded-md bg-white p-5 text-slate-700 shadow-xl">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-lg font-semibold">User Guide</h2>
            <p className="text-xs text-slate-500">Guide to creating and managing Sales Invoices.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close user guide"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 text-sm leading-6">
          {guideTemplate.map((step) => (
            <section key={step.number} className="rounded-md border border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpenStep((prev) => (prev === step.number ? 0 : step.number))}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#a8bca6] text-sm font-semibold text-white">
                    {step.number}
                  </span>
                  <h3 className="text-2xl font-medium text-slate-800">{step.title}</h3>
                </div>
                <ExpandMoreIcon
                  fontSize="small"
                  className={`transition-transform duration-200 ${openStep === step.number ? 'rotate-180' : ''}`}
                />
              </button>

              {openStep === step.number ? (
                <div className="mt-3">
                  {step.description ? (
                    <p className="text-sm text-slate-700">{step.description}</p>
                  ) : null}

                  {step.note ? (
                    <p className="mt-2 text-sm font-medium text-red-500">{step.note}</p>
                  ) : null}

                  {step.screenshots.length > 0 && !(activeShot && activeShot.step === step.number) ? (
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {step.screenshots.map((shot) => (
                        <div key={shot.src} className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                          <img
                            src={shot.src}
                            alt={shot.alt}
                            className="h-auto max-h-[320px] w-full cursor-zoom-in object-contain"
                            loading="lazy"
                            onClick={() => openZoom({ ...shot, step: step.number })}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {activeShot && activeShot.step === step.number ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                        <p className="text-sm font-medium text-slate-700">Image Preview ({Math.round(zoomLevel * 100)}%)</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={zoomOut}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-100 bg-[#0b2a32] hover:bg-slate-500"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={zoomIn}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-100 bg-[#0b2a32] hover:bg-slate-500"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={zoomReset}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-100 bg-[#0b2a32] hover:bg-slate-500"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={closeZoom}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-100 bg-[#0b2a32] hover:bg-slate-500"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[60vh] overflow-auto rounded bg-white">
                        <img
                          src={activeShot.src}
                          alt={activeShot.alt}
                          className="mx-auto h-auto max-w-none origin-center object-contain"
                          style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#315266] px-4 py-2 text-sm font-medium text-white hover:bg-[#27414f]"
          >
            Close
          </button>
        </div>
      </div>

    </div>,
    document.body
  )
}
