import { redirect } from "next/navigation";
import { demoWorkspace } from "@/lib/mock-data";
import { recordAuditLog } from "@/server/audit-log";
import { publishEvent } from "@/server/events";
import { createCustomer } from "@/server/repositories";
import { BusinessSidebar } from "../../_components/business-sidebar";

export const dynamic = "force-dynamic";

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

async function createCustomerAction(formData: FormData) {
  "use server";

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) {
    redirect("/app/business/customers/new?error=displayName");
  }

  const email = optionalText(formData, "email");
  const phone = optionalText(formData, "phone");
  const instagram = optionalText(formData, "instagram");
  const xAccount = optionalText(formData, "xAccount");
  const customer = await createCustomer({
    workspaceId: demoWorkspace.id,
    name: optionalText(formData, "name"),
    displayName,
    contactInformation: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {})
    },
    lineUserId: optionalText(formData, "lineUserId"),
    snsAccounts: {
      ...(instagram ? { instagram } : {}),
      ...(xAccount ? { x: xAccount } : {})
    },
    sourceChannel: optionalText(formData, "sourceChannel"),
    customerStatus: "active",
    totalRevenue: 0,
    purchaseCount: 0
  });

  await Promise.all([
    publishEvent({
      eventType: "growth.customer.created.v1",
      source: "growth-engine",
      workspaceId: customer.workspaceId,
      payload: { customerId: customer.id }
    }),
    recordAuditLog({
      workspaceId: customer.workspaceId,
      actorUserId: demoWorkspace.ownerUserId,
      action: "Customer.Created",
      targetType: "customer",
      targetId: customer.id,
      metadata: { operation: "create", sourceChannel: customer.sourceChannel }
    })
  ]);

  redirect(`/app/business/customers/${customer.id}`);
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCustomerPage({ searchParams }: Props) {
  const query = await searchParams;
  const hasDisplayNameError = query.error === "displayName";

  return (
    <div className="shell">
      <BusinessSidebar activeKey="customers" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / Customer正本</p>
            <h2 className="page-title">新しいお客様を登録</h2>
          </div>
          <a className="button secondary" href="/app/business/customers">
            一覧へ戻る
          </a>
        </header>

        <section className="card">
          <p className="muted">
            最初は表示名だけで登録できます。連絡先や流入元は、分かる範囲だけ入力してください。
          </p>
          {hasDisplayNameError ? (
            <p className="warning">表示名を入力してください。</p>
          ) : null}
          <form action={createCustomerAction} className="form-stack">
            <label className="field-label">
              表示名（必須）
              <input name="displayName" required placeholder="例: 山田さん" autoFocus />
            </label>
            <label className="field-label">
              氏名
              <input name="name" placeholder="例: 山田 花子" />
            </label>
            <label className="field-label">
              メール
              <input name="email" type="email" inputMode="email" />
            </label>
            <label className="field-label">
              電話
              <input name="phone" type="tel" inputMode="tel" />
            </label>
            <label className="field-label">
              LINE ID
              <input name="lineUserId" />
            </label>
            <label className="field-label">
              Instagram
              <input name="instagram" placeholder="@username" />
            </label>
            <label className="field-label">
              X
              <input name="xAccount" placeholder="@username" />
            </label>
            <label className="field-label">
              流入元
              <select name="sourceChannel" defaultValue="">
                <option value="">未設定</option>
                <option value="line">LINE</option>
                <option value="instagram">Instagram</option>
                <option value="x">X</option>
                <option value="referral">紹介</option>
                <option value="website">Webサイト</option>
                <option value="other">その他</option>
              </select>
            </label>
            <div className="action-row">
              <button className="button" type="submit">登録する</button>
              <a className="button secondary" href="/app/business/customers">キャンセル</a>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
