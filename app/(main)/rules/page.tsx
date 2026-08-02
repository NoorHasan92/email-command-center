import { getRulesAction } from "@/server/actions/rules.actions";
import RulesClient from "./RulesClient";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { rules } = await getRulesAction();
  
  return (
    <RulesClient initialRules={rules || []} />
  );
}
