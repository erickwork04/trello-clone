import { Check } from "lucide-react";

export function InboxEmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
                <Check className="size-6 text-slate-500" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-slate-900">
                Tudo organizado por aqui!
            </h3>

            <p className="mt-2 max-w-57.5 text-sm leading-6 text-slate-500">
                Assim que você definir uma categoria ou mover para um projeto, os itens aparecerão aqui.
            </p>

            <div className="mt-8 w-full rounded-xl bg-blue-50 px-5 py-4">
                <p className="text-sm italic leading-6 text-blue-600">
                    “Organizar hoje é abrir espaço para o que realmente importa.”
                </p>
            </div>
        </div>
    );
}