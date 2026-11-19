import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  /** Rails から返った該当項目のエラーメッセージ */
  errors?: string[];
  hint?: string;
};

/** ラベル・入力欄・エラー表示をまとめた入力項目 */
export function FormField({ label, name, errors = [], hint, ...inputProps }: Props) {
  const id = `field-${name}`;
  const describedBy = errors.length > 0 ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={errors.length > 0}
        aria-describedby={describedBy}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500"
        {...inputProps}
      />
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
