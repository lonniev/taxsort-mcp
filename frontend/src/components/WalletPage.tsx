import { UsageSummary, Wallet } from "@tollbooth-dpyc/web/react";
import { usageClassNames } from "../utils/accountStyles";

export default function WalletPage() {
  return (
    <div className="w-[85%] mx-auto grid gap-6">
      <Wallet />
      <UsageSummary heading="Credit Balance" classNames={{ ...usageClassNames, root: "bg-white border border-stone-200 rounded-xl p-6" }} />
    </div>
  );
}
