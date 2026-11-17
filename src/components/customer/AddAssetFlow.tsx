"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CircleCheck,
  FileCheck2,
  FileText,
  FileUp,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import { buttonClass } from "@/components/will/ui";
import {
  defaultPrice,
  sampleConnectedAccounts,
  sampleEstimates,
  sampleImport,
  sampleInstitutions,
  samplePncAccounts,
  samplePrices,
  sampleTitleCheck,
  type AddOption,
} from "@/data/addAsset";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

type Step = "ask" | "proof" | "working" | "result" | "done";

/** The first number in what someone typed ("1,000", "$12.50", "EUR 100"). */
const amount = (s = "") => Number.parseFloat(s.replace(/[^\d.]/g, "")) || 0;

/** One kind of asset's demo flow, in a dialog. Nothing is saved. */
export function AddAssetFlow({
  option,
  onClose,
}: {
  option: AddOption | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={option !== null}
      onClose={onClose}
      title={option?.label ?? ""}
      description={option?.description}
    >
      {option && <Flow key={option.id} option={option} onClose={onClose} />}
    </Dialog>
  );
}

function Flow({ option: o, onClose }: { option: AddOption; onClose: () => void }) {
  // PNC already knows the customer's accounts, so that flow starts by looking them up.
  const [step, setStep] = useState<Step>(o.flow === "pnc" ? "working" : "ask");
  const [values, setValues] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(o.flow === "pnc" ? "PNC" : null);
  const [kind, setKind] = useState("Trust");

  // A short pause where a real flow would connect, look up or estimate.
  useEffect(() => {
    if (step !== "working") return;
    const t = window.setTimeout(() => setStep("result"), 1200);
    return () => window.clearTimeout(t);
  }, [step]);

  if (step === "done") return <Done onClose={onClose} />;

  if (step === "working")
    return (
      <Body>
        <div className="flex flex-col items-center py-8 text-center" role="status">
          <LoaderCircle
            className="size-8 text-pnc-blue-700 motion-safe:animate-spin"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold text-pnc-ink">
            {o.flow === "pnc"
              ? "Finding your PNC accounts"
              : o.flow === "connect"
                ? `Connecting to ${picked}`
                : o.flow === "import"
                  ? "Reading your file"
                  : o.flow === "document"
                    ? "Checking the document"
                    : "Estimating its value"}
          </p>
          <p className="mt-1 text-sm text-pnc-muted">This takes a moment.</p>
        </div>
      </Body>
    );

  if (step === "result")
    return <Result option={o} values={values} picked={picked} onAdd={() => setStep("done")} />;

  // A document flow asks for the paper that proves ownership before anything is added.
  if (step === "proof" && o.proof)
    return (
      <Body>
        <p className="font-semibold text-pnc-ink">Proof of ownership</p>
        <p className="mt-0.5 text-sm text-pnc-muted">{o.proof.hint}</p>
        <button
          type="button"
          onClick={() => setStep("working")}
          className="mt-3 flex w-full flex-col items-center rounded-lg border-2 border-dashed border-pnc-line px-6 py-8 text-center hover:border-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
        >
          <FileUp className="size-7 text-pnc-blue-700" aria-hidden="true" />
          <span className="mt-2 font-semibold text-pnc-ink">{o.proof.label}</span>
          <span className="mt-0.5 text-sm text-pnc-muted">PDF, JPG or PNG</span>
        </button>
      </Body>
    );

  // First screen: what the flow needs to know.
  if (o.flow === "connect")
    return (
      <PickInstitution
        onPick={(name) => {
          setPicked(name);
          setStep("working");
        }}
      />
    );

  if (o.flow === "import")
    return (
      <Body>
        <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-pnc-line px-6 py-8 text-center hover:border-pnc-link focus-within:border-pnc-link">
          <FileUp className="size-7 text-pnc-blue-700" aria-hidden="true" />
          <span className="mt-2 font-semibold text-pnc-ink">Choose a spreadsheet</span>
          <span className="mt-0.5 text-sm text-pnc-muted">CSV or Excel, one asset per row</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={() => setStep("working")}
          />
        </label>
        <button
          type="button"
          onClick={() => setStep("working")}
          className={cn(buttonClass.link, "mt-4")}
        >
          Use a sample file
        </button>
      </Body>
    );

  const ready = (o.ask?.fields ?? []).every((f) => values[f.id]?.trim());
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        setStep(
          o.flow === "estimate"
            ? "working"
            : o.flow === "document"
              ? "proof"
              : o.flow === "ticker"
                ? "result"
                : "done",
        );
      }}
    >
      <Body>
        <p className="font-semibold text-pnc-ink">{o.ask?.title}</p>
        <div className="mt-3 space-y-3">
          {o.ask?.fields.map((f) => (
            <Field
              key={f.id}
              label={f.label}
              placeholder={f.placeholder}
              value={values[f.id] ?? ""}
              onChange={(v) => setValues({ ...values, [f.id]: v })}
            />
          ))}
          {o.flow === "portfolio" && (
            <fieldset>
              <legend className="text-sm font-semibold text-pnc-ink">Type</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {["Trust", "LLC", "Partnership"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1",
                      kind === k
                        ? "bg-pnc-ink text-white ring-pnc-ink"
                        : "bg-white text-pnc-ink ring-pnc-line hover:ring-pnc-muted",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </Body>
      <Footer>
        <button type="submit" disabled={!ready} className={buttonClass.primary}>
          {o.flow === "estimate"
            ? "Estimate value"
            : o.flow === "ticker"
              ? "Look it up"
              : o.flow === "portfolio"
                ? "Link portfolio"
                : o.flow === "document"
                  ? "Continue"
                  : "Add asset"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </Footer>
    </form>
  );
}

function PickInstitution({ onPick }: { onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const id = useId();
  const shown = sampleInstitutions.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Body>
      <label
        htmlFor={id}
        className="flex items-center gap-2 rounded-full border border-pnc-line px-3.5 py-2 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
      >
        <Search className="size-4 text-pnc-muted" aria-hidden="true" />
        <span className="sr-only">Find your institution</span>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find your bank or exchange"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-pnc-muted"
        />
      </label>
      <ul className="mt-3 divide-y divide-pnc-line rounded-lg border border-pnc-line">
        {shown.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => onPick(n)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-pnc-ink hover:bg-pnc-surface hover:text-pnc-link focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
            >
              {n}
              <ArrowRight className="size-4 text-pnc-link" aria-hidden="true" />
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-4 py-3 text-sm text-pnc-muted">No match. Try another name.</li>
        )}
      </ul>
    </Body>
  );
}

function Result({
  option: o,
  values,
  picked,
  onAdd,
}: {
  option: AddOption;
  values: Record<string, string>;
  picked: string | null;
  onAdd: () => void;
}) {
  let body: ReactNode;
  let action = "Add to Assets and Debts";
  if (o.flow === "document") {
    body = <TitleCheck values={values} />;
  } else if (o.flow === "pnc") {
    const found = samplePncAccounts[o.id] ?? [];
    body = (
      <>
        <p className="font-semibold text-pnc-ink">In your name at PNC</p>
        <Rows rows={found.map((a) => [`${a.name} x${a.last4}`, a.balance])} />
      </>
    );
    action = found.length === 1 ? "Add this account" : `Add ${found.length} accounts`;
  } else if (o.flow === "connect") {
    body = (
      <>
        <p className="font-semibold text-pnc-ink">Found at {picked}</p>
        <Rows rows={sampleConnectedAccounts.map((a) => [`${a.name} x${a.last4}`, a.balance])} />
      </>
    );
    action = `Add ${sampleConnectedAccounts.length} accounts`;
  } else if (o.flow === "import") {
    body = (
      <>
        <p className="font-semibold text-pnc-ink">{sampleImport.length} assets in your file</p>
        <Rows rows={sampleImport.map((a) => [a.name, a.value])} />
      </>
    );
    action = `Add ${sampleImport.length} assets`;
  } else if (o.flow === "ticker") {
    const ticker = (values.ticker ?? "").trim().toUpperCase();
    const price = samplePrices[ticker] ?? defaultPrice;
    const qty = amount(values.quantity);
    body = (
      <>
        <p className="text-sm text-pnc-muted">
          {qty.toLocaleString("en-US")} × {ticker} at <Money value={price} />
        </p>
        <p className="mt-1 font-display text-3xl font-medium text-pnc-ink">
          <Money value={qty * price} />
        </p>
      </>
    );
    action = "Add holding";
  } else {
    const e = sampleEstimates[o.id] ?? sampleEstimates.appraise;
    body = (
      <>
        <p className="text-sm text-pnc-muted">Estimated value</p>
        <p className="mt-1 font-display text-3xl font-medium text-pnc-ink">
          <Money value={e.value} />
        </p>
        <p className="mt-1 text-sm text-pnc-muted">
          Likely between <Money value={e.low} compact /> and <Money value={e.high} compact />. We
          update it every month.
        </p>
      </>
    );
  }
  return (
    <>
      <Body>
        <div className="mb-3 flex justify-end">
          <MockBadge />
        </div>
        {body}
      </Body>
      <Footer>
        <button type="button" onClick={onAdd} className={buttonClass.primary}>
          {action}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </Footer>
    </>
  );
}

/** What the uploaded title shows, checked against the person and what they entered. */
function TitleCheck({ values }: { values: Record<string, string> }) {
  const { person } = useViewer();
  const t = sampleTitleCheck;
  const vehicle = [values.year, values.model].filter(Boolean).join(" ");
  const checks = [
    `Owner on the title: ${person.name}, matches your profile`,
    `Vehicle: ${vehicle}, matches what you entered`,
    `Liens: ${t.liens.toLowerCase()}`,
  ];
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-pnc-line p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-pnc-blue-50 text-pnc-blue-700">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-pnc-ink">{t.document}</span>
          <span className="block truncate text-xs text-pnc-muted">
            {t.file} · title {t.titleNumber} · issued {t.issued}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pnc-positive-bg px-2.5 py-1 text-xs font-semibold text-pnc-positive">
          <FileCheck2 className="size-3.5" aria-hidden="true" /> Verified
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-pnc-ink">
        {checks.map((c) => (
          <li key={c} className="flex gap-2">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-pnc-positive" aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-pnc-muted">
        The title is kept with the vehicle on Assets and Debts, so your family and your advisor can
        see it is yours.
      </p>
    </>
  );
}

function Rows({ rows }: { rows: [string, number][] }) {
  return (
    <ul className="mt-3 divide-y divide-pnc-line rounded-lg border border-pnc-line">
      {rows.map(([name, value]) => (
        <li key={name} className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
          <span className="text-pnc-ink">{name}</span>
          <Money value={value} className="font-semibold text-pnc-ink" />
        </li>
      ))}
    </ul>
  );
}

function Done({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Body>
        <div className="flex flex-col items-center py-6 text-center" role="status">
          <CircleCheck className="size-10 text-pnc-positive" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-medium text-pnc-ink">
            Added to Assets and Debts
          </p>
          <p className="mt-1 text-sm text-pnc-muted">This is a demo, so nothing was saved.</p>
        </div>
      </Body>
      <Footer>
        <button type="button" onClick={onClose} className={buttonClass.secondary}>
          Add another
        </button>
        <Link href={routes.assets} className={buttonClass.primary}>
          Back to Assets and Debts
        </Link>
      </Footer>
    </>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-pnc-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-pnc-line px-3 py-2 text-md text-pnc-ink outline-none placeholder:text-pnc-muted focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15"
      />
    </div>
  );
}

const Body = ({ children }: { children: ReactNode }) => <div className="px-5 py-5">{children}</div>;
const Footer = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap justify-end gap-3 border-t border-pnc-line px-5 py-4">
    {children}
  </div>
);
