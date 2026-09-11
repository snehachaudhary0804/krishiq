import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { IconBank } from "../../components/icons.jsx";

export default function BankDetails() {
  const { user, loginSuccess } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.bankDetails) {
      setForm({
        accountHolderName: user.bankDetails.accountHolderName || "",
        accountNumber: user.bankDetails.accountNumber || "",
        ifsc: user.bankDetails.ifsc || "",
        bankName: user.bankDetails.bankName || "",
      });
    }
  }, [user]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    if (
      !form.accountHolderName ||
      !form.accountNumber ||
      !form.ifsc ||
      !form.bankName
    ) {
      return toast("All fields are required");
    }

    setBusy(true);

    try {
      const data = await api.saveBankDetails(form);
      const token = localStorage.getItem("kq_token");

      loginSuccess(token, data.user);

      toast("Bank details saved. Your procurement payments will be sent here.");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="hero">
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <IconBank
            style={{
              width: 24,
              height: 24,
              color: "var(--brand)",
            }}
          />
          {t("bankDetails")}
        </h1>

        <p>
          Add your bank account so the agency can send your procurement payment
          directly to it.
        </p>
      </div>

      <div className="cards2">
        {/* Bank Details Form */}
        <div className="card">
          <form onSubmit={submit}>
            <div className="field">
              <label>{t("accountHolderName")}</label>
              <input
                value={form.accountHolderName}
                onChange={(e) =>
                  update("accountHolderName", e.target.value)
                }
                placeholder="As per bank passbook"
              />
            </div>

            <div className="field">
              <label>{t("accountNumber")}</label>
              <input
                value={form.accountNumber}
                onChange={(e) =>
                  update("accountNumber", e.target.value)
                }
                placeholder="Bank account number"
              />
            </div>

            <div className="form2">
              <div className="field">
                <label>{t("ifsc")}</label>
                <input
                  value={form.ifsc}
                  onChange={(e) =>
                    update("ifsc", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <div className="field">
                <label>{t("bankName")}</label>
                <input
                  value={form.bankName}
                  onChange={(e) =>
                    update("bankName", e.target.value)
                  }
                  placeholder="e.g. State Bank of India"
                />
              </div>
            </div>

            <button className="btn" disabled={busy} type="submit">
              <IconBank style={{ width: 15, height: 15 }} />
              {busy ? "Saving..." : t("saveBankDetails")}
            </button>
          </form>
        </div>

        {/* Information Card */}
        <div className="card">
          <h2>Why we ask for this</h2>

          <div
            style={{
              background: "#e4f3eb",
              borderLeft: "4px solid var(--brand)",
              padding: "16px 18px",
              borderRadius: 12,
              lineHeight: 1.5,
            }}
          >
            Your procurement payment is transferred directly to this account
            once weighing and quality checks are complete.
          </div>
        </div>
      </div>
    </>
  );
}