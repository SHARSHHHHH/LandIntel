export function SampleDataBanner() {
  return (
    <div className="rounded-sm border border-register-sample/40 bg-register-sample/[0.06] p-3 text-xs text-register-ink/80">
      <p className="font-semibold text-register-navy">What&apos;s real vs. sample on this page</p>
      <p className="mt-1">
        District boundaries, headquarters locations and the district census profile are real, sourced data
        (tagged <strong>Official</strong>/<strong>Derived</strong>/<strong>Historical</strong> per layer). Everything below district
        level &mdash; Tehsil/Taluk/Mandal, village and land-parcel boundaries, ownership, survey numbers, mutation and dispute
        status &mdash; is <strong>generated sample data</strong> for demonstration only. No real cadastral or land-record dataset
        is connected in this environment; nothing below district level should be treated as an actual land record.
      </p>
    </div>
  );
}
