import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useT } from "../i18n";

/** The privacy policy, written as Markdown in each language's catalog. */
export default function PrivacyPage() {
  const t = useT();
  return (
    <div className="w-[85%] mx-auto">
      <div className="bg-white border border-stone-200 rounded-xl p-8 prose prose-sm prose-stone max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{t("views.privacy.body")}</Markdown>
      </div>
    </div>
  );
}
