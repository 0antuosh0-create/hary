export function Crest({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 70 80" fill="none" aria-hidden="true">
      <path d="M35 5 57 14v26c0 15-10 25-22 32C23 65 13 55 13 40V14L35 5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M35 11 51 18v22c0 11-6 20-16 26-10-6-16-15-16-26V18L35 11Z" stroke="currentColor" strokeWidth=".5" />
      <path d="M7 28C1 37 5 54 18 63M63 28c6 9 2 26-11 35M8 40 3 36m8 12-7-4m12 12-8-2m54-14 5-4m-8 12 7-4m-12 12 8-2" stroke="currentColor" strokeWidth=".8" />
      <path d="m35 0 1.3 3.6L40 5l-3.7 1.4L35 10l-1.3-3.6L30 5l3.7-1.4L35 0Z" fill="currentColor" />
      <text x="35" y="48" textAnchor="middle" fill="currentColor" fontSize="33" fontFamily="Cinzel, Georgia, serif">H</text>
      <path d="m30 56 5 3 5-3" stroke="currentColor" strokeWidth=".6" />
    </svg>
  );
}

export function Snitch() {
  return (
    <svg viewBox="0 0 150 65" fill="none" aria-hidden="true">
      <g className="snitch-wing snitch-wing-left" stroke="currentColor" strokeWidth=".8">
        <path d="M63 35C40 32 29 10 4 7c7 17 28 36 59 33M62 35 9 10m53 27L15 17m46 22L23 25M51 32 37 17m8 13-13-15M38 26l-12-12" />
      </g>
      <g className="snitch-wing snitch-wing-right" stroke="currentColor" strokeWidth=".8">
        <path d="M87 35c23-3 34-25 59-28-7 17-28 36-59 33m1-5 53-25M88 37l47-20M89 39l38-14m-28 7 14-15m-8 13 13-15m-6 11 12-12" />
      </g>
      <circle cx="75" cy="38" r="13" fill="#8d713e" stroke="#d2b878" />
      <circle cx="75" cy="38" r="9" stroke="#d2b878" strokeWidth=".6" />
      <path d="M66 33c4 5 10 8 20 5m-18 8c8-1 13-7 14-18m-12-1c-1 11 3 17 10 21" stroke="#d2b878" strokeWidth=".65" />
      <ellipse cx="71" cy="32" rx="3" ry="2" fill="#e6d099" opacity=".6" />
    </svg>
  );
}

export function WizardHat() {
  return (
    <svg className="wizard-hat" viewBox="0 0 180 150" fill="none" aria-hidden="true">
      <path d="M30 119C49 93 68 34 106 5c-4 28 3 45 14 60l29 54Z" fill="#3c3335" stroke="#241c20" strokeWidth="3" />
      <path d="M106 5C75 45 72 77 77 113L30 119C49 93 68 34 106 5Z" fill="#56484a" />
      <path d="m49 95 85-6 8 19-102 7Z" fill="#a4864c" />
      <path d="m91 93 21-2 2 17-22 1Z" fill="#332b29" stroke="#dec18a" strokeWidth="3" />
      <path d="M4 123c13-14 43-8 78-10 38-3 71-15 92 2-5 13-48 26-88 25-40 0-68-5-82-17Z" fill="#413638" stroke="#241c20" strokeWidth="3" />
      <path d="m85 51 9 5m-20 14 19-3" stroke="#2b2328" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
