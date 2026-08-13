import { redirect, notFound } from "next/navigation";
import { demoWorkspace } from "@/lib/mock-data";
import { findCustomer, updateCustomer } from "@/server/repositories";
import { BusinessSidebar } from "../../../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ customerId: string }>;
};

async function updateCustomerAction(customerId: string, formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  await updateCustomer(demoWorkspace.id, customerId, {
    displayName: String(formData.get("displayName") ?? ""),
    name: String(formData.get("name") ?? "") || undefined,
    lineUserId: String(formData.get("lineUserId") ?? "") || undefined,
    sourceChannel: String(formData.get("sourceChannel") ?? "") || undefined,
    customerStatus: String(formData.get("customerStatus") ?? "active") as "active" | "inactive" | "blocked",
    contactInformation: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {})
    }
  });
  redirect(`/app/business/customers/${customerId}`);
}

export default async function CustomerEditPage({ params }: Props) {
  const { customerId } = await params;
  const customer = await findCustomer(demoWorkspace.id, customerId);

  if (!customer) {
    notFound();
  }

  return (
    <div className="shell">
      <BusinessSidebar activeKey="customers" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / Customer正本</p>
            <h2 className="page-title">お客様情報を編集</h2>
          </div>
          <a className="button secondary" href={`/app/business/customers/${customer.id}`}>
            詳細へ戻る
          </a>
        </header>

        <section className="card">
          <form action={updateCustomerAction.bind(null, customer.id)} className="form-stack">
            <label className="field-label">
              表示名
              <input name="displayName" required defaultValue={customer.displayName} />
            </label>
            <label className="field-label">
              氏名
              <input name="name" defaultValue={customer.name ?? ""} />
            </label>
            <label className="field-label">
              メール
              <input name="email" type="email" defaultValue={customer.contactInformation.email ?? ""} />
            </label>
            <label className="field-label">
              電話
              <input name="phone" defaultValue={customer.contactInformation.phone ?? ""} />
            </label>
            <label className="field-label">
              LINE ID
              <input name="lineUserId" defaultValue={customer.lineUserId ?? ""} />
            </label>
            <label className="field-label">
              流入元
              <input name="sourceChannel" defaultValue={customer.sourceChannel ?? ""} />
            </label>
            <label className="field-label">
              状態
              <select name="customerStatus" defaultValue={customer.customerStatus}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="blocked">blocked</option>
              </select>
            </label>
            <div className="action-row">
              <button className="button" type="submit">
                保存
              </button>
              <a className="button secondary" href={`/app/business/customers/${customer.id}`}>
                キャンセル
              </a>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
