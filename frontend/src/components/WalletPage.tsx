import { UsageSummary, Wallet } from "@tollbooth-dpyc/web/react";
import { usageClassNames } from "../utils/accountStyles";
import { useT } from "../i18n";

export default function WalletPage() {
  const t = useT();
  return (
    <div className="w-[85%] mx-auto grid gap-6">
      <Wallet />
      <UsageSummary heading={t("views.profile.credit")} classNames={{ ...usageClassNames, root: "bg-white border border-stone-200 rounded-xl p-6" }} />
    </div>
  );
}
