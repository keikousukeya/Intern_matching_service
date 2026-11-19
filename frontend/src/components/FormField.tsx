import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type CommonProps = {
  label: string;
  name: string;
  /** Rails から返った該当項目のエラーメッセージ */
  errors?: string[];
  hint?: string;
  /** ラベル横に「必須」を表示する */
  requiredMark?: boolean;
};

const CONTROL_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500";

/** ラベル・エラー表示・補足説明の共通部分 */
function FieldShell({
  label,
  name,
  errors = [],
  hint,
  requiredMark,
  children,
}: CommonProps & { children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode }) {
  const id = `field-${name}`;
  const describedBy = errors.length > 0 ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {requiredMark && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600">必須</span>}
      </label>
      {children({ id, describedBy, invalid: errors.length > 0 })}
      {errors.length > 0 ? (
        <ul id={`${id}-error`} className="text-sm text-rose-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** ラベル・入力欄・エラー表示をまとめた入力項目 */
export function FormField({
  label,
  name,
  errors,
  hint,
  requiredMark,
  ...inputProps
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} requiredMark={requiredMark}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={CONTROL_CLASS}
          {...inputProps}
        />
      )}
    </FieldShell>
  );
}

/** 複数行の入力項目 */
export function TextAreaField({
  label,
  name,
  errors,
  hint,
  requiredMark,
  ...textareaProps
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} requiredMark={requiredMark}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={CONTROL_CLASS}
          rows={6}
          {...textareaProps}
        />
      )}
    </FieldShell>
  );
}

/** 選択式の入力項目 */
export function SelectField({
  label,
  name,
  errors,
  hint,
  requiredMark,
  children,
  ...selectProps
}: CommonProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} requiredMark={requiredMark}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={CONTROL_CLASS}
          {...selectProps}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
