import { notFound, redirect } from "next/navigation";
import { demoWorkspace, products } from "@/lib/mock-data";
import { recordAuditLog } from "@/server/audit-log";
import { publishEvent } from "@/server/events";
import {
  createReservation,
  findCustomer,
  findProduct,
  listCustomers
} from "@/server/repositories";
import { BusinessSidebar } from "../../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function toReservationTimes(date: string, time: string, durationMinutes: number) {
  const scheduledStartAt = new Date(`${date}T${time}:00+09:00`);

  if (Number.isNaN(scheduledStartAt.getTime())) {
    return undefined;
  }

  return {
    scheduledStartAt: scheduledStartAt.toISOString(),
    scheduledEndAt: new Date(
      scheduledStartAt.getTime() + durationMinutes * 60 * 1000
    ).toISOString()
  };
}

function errorLocation(customerId: string | undefined, error: string) {
  const query = new URLSearchParams({ error });
  if (customerId) query.set("customerId", customerId);
  return `/app/business/reservations/new?${query.toString()}`;
}

async function createReservationAction(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();

  if (!customerId || !productId || !preferredDate || !preferredTime) {
    redirect(errorLocation(customerId || undefined, "required"));
  }

  const [customer, product] = await Promise.all([
    findCustomer(demoWorkspace.id, customerId),
    findProduct(demoWorkspace.id, productId)
  ]);

  if (!customer) {
    redirect(errorLocation(undefined, "customer"));
  }

  if (!product || !product.active) {
    redirect(errorLocation(customer.id, "product"));
  }

  const times = toReservationTimes(
    preferredDate,
    preferredTime,
    product.durationMinutes
  );

  if (!times) {
    redirect(errorLocation(customer.id, "datetime"));
  }

  const statusValue = String(formData.get("status") ?? "requested");
  const status = statusValue === "confirmed" ? "confirmed" : "requested";
  const reservation = await createReservation({
    workspaceId: demoWorkspace.id,
    customerId: customer.id,
    productId: product.id,
    professionalStudioType: product.professionalStudioType,
    ...times,
    status,
    sourceChannel: optionalText(formData, "sourceChannel") ?? "business_manual",
    paymentStatus: "unpaid"
  });

  await Promise.all([
    publishEvent({
      eventType: "growth.reservation.created.v1",
      source: "growth-engine",
      workspaceId: reservation.workspaceId,
      payload: {
        reservationId: reservation.id,
        customerId: reservation.customerId,
        productId: reservation.productId
      }
    }),
    recordAuditLog({
      workspaceId: reservation.workspaceId,
      actorUserId: demoWorkspace.ownerUserId,
      action: "Reservation.Created",
      targetType: "reservation",
      targetId: reservation.id,
      metadata: {
        operation: "create",
        customerId: reservation.customerId,
        productId: reservation.productId,
        status: reservation.status,
        sourceChannel: reservation.sourceChannel
      }
    })
  ]);

  redirect(`/app/business/reservations/${reservation.id}`);
}

const errorMessages: Record<string, string> = {
  required: "お客様、メニュー、予約日、開始時刻を入力してください。",
  customer: "選択したお客様が見つかりません。もう一度選択してください。",
  product: "選択したメニューは現在利用できません。",
  datetime: "予約日時を確認してください。"
};

export default async function NewReservationPage({ searchParams }: Props) {
  const query = await searchParams;
  const selectedCustomerId = first(query.customerId) ?? "";
  const error = first(query.error);
  const customers = (await listCustomers(demoWorkspace.id)).filter(
    (customer) => customer.customerStatus === "active"
  );
  const activeProducts = products.filter(
    (product) => product.workspaceId === demoWorkspace.id && product.active
  );

  if (selectedCustomerId) {
    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId
    );
    if (!selectedCustomer && !error) notFound();
  }

  return (
    <div className="shell">
      <BusinessSidebar activeKey="reservations" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / 予約正本</p>
            <h2 className="page-title">予約を登録</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">
            予約一覧へ戻る
          </a>
        </header>

        <section className="card">
          <p className="muted">
            既存のお客様を選び、Business側で予約を登録します。保存後はD1の予約詳細へ移動します。
          </p>
          {error ? (
            <p className="warning">
              {errorMessages[error] ?? "入力内容を確認してください。"}
            </p>
          ) : null}

          {customers.length === 0 ? (
            <div>
              <p>予約を作るには、先にお客様を登録してください。</p>
              <a className="button" href="/app/business/customers/new">
                新しいお客様を登録
              </a>
            </div>
          ) : (
            <form action={createReservationAction} className="form-stack">
              <label className="field-label">
                お客様（必須）
                <select name="customerId" required defaultValue={selectedCustomerId}>
                  <option value="">選択してください</option>
                  {customers.map((customer) => (
                    <option value={customer.id} key={customer.id}>
                      {customer.displayName}（{customer.customerNumber}）
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                メニュー（必須）
                <select name="productId" required defaultValue={activeProducts[0]?.id ?? ""}>
                  {activeProducts.map((product) => (
                    <option value={product.id} key={product.id}>
                      {product.name}（{product.durationMinutes}分）
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                予約日（必須）
                <input name="preferredDate" type="date" required />
              </label>
              <label className="field-label">
                開始時刻（必須）
                <input name="preferredTime" type="time" required />
              </label>
              <label className="field-label">
                予約状態
                <select name="status" defaultValue="confirmed">
                  <option value="confirmed">確定</option>
                  <option value="requested">受付済み</option>
                </select>
              </label>
              <label className="field-label">
                受付経路
                <select name="sourceChannel" defaultValue="business_manual">
                  <option value="business_manual">直接受付</option>
                  <option value="line">LINE</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X</option>
                  <option value="referral">紹介</option>
                  <option value="phone">電話</option>
                  <option value="other">その他</option>
                </select>
              </label>
              <p className="muted">
                支払い状態は「未払い」で作成します。支払いの正本はPaymentとして別に管理します。
              </p>
              <div className="action-row">
                <button className="button" type="submit">予約を登録</button>
                <a className="button secondary" href="/app/business/reservations">キャンセル</a>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
