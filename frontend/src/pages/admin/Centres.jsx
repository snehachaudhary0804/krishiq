import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { IconBuilding } from "../../components/icons.jsx";

const emptyForm = {
  name: "",
  district: "",
  capacity: 70,
  counters: 2,
  cropList: "",
  latitude: "",
  longitude: "",
  operatorId: "",
};

export default function Centres() {
  const toast = useToast();

  const [centres, setCentres] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function load() {
    try {
      setLoading(true);

      const [centreData, operatorData] = await Promise.all([
        api.getCentres(),
        api.getOperators(),
      ]);

      setCentres(centreData.centres || []);
      setOperators(operatorData.operators || []);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(centre) {
    setEditingId(centre._id);

    setForm({
      name: centre.name || "",
      district: centre.district || "",
      capacity: centre.capacity ?? 70,
      counters: centre.counters ?? 2,
      cropList: centre.cropList?.length
        ? centre.cropList.join(", ")
        : "",
      latitude: centre.latitude ?? "",
      longitude: centre.longitude ?? "",
      operatorId:
        centre.operator?._id ||
        centre.operator ||
        "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function submit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      return toast("Centre name is required");
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      return toast("Capacity invalid");
    }

    if (!form.counters || Number(form.counters) < 1) {
      return toast("Counters must be at least 1");
    }

    setBusy(true);

    try {
      const payload = {
        name: form.name.trim(),
        district: form.district.trim(),
        capacity: Number(form.capacity),
        counters: Number(form.counters) || 1,
        cropList: form.cropList,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      let centreId = editingId;

      if (editingId) {
        await api.updateCentre(editingId, payload);
        toast("Centre updated successfully");
      } else {
        const created = await api.createCentre(payload);
        centreId = created.centre._id;
        toast("Centre created successfully");
      }

      await api.assignOperator(
        centreId,
        form.operatorId || null
      );

      cancelForm();
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const filteredCentres = useMemo(() => {
    const query = search.trim().toLowerCase();

    return centres.filter((centre) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        centre.status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      const name =
        centre.name?.toLowerCase() || "";

      const district =
        centre.district?.toLowerCase() || "";

      const operator =
        centre.operator?.name?.toLowerCase() || "";

      const employeeId =
        centre.operator?.employeeId?.toLowerCase() || "";

      const crops =
        centre.cropList
          ?.join(" ")
          ?.toLowerCase() || "";

      return (
        name.includes(query) ||
        district.includes(query) ||
        operator.includes(query) ||
        employeeId.includes(query) ||
        crops.includes(query)
      );
    });
  }, [centres, search, statusFilter]);

  const openCount = centres.filter(
    (centre) => centre.status === "OPEN"
  ).length;

  const closedCount =
    centres.length - openCount;

  const totalCapacity = centres.reduce(
    (sum, centre) =>
      sum + Number(centre.capacity || 0),
    0
  );

  const totalBooked = centres.reduce(
    (sum, centre) =>
      sum + Number(centre.booked || 0),
    0
  );

  function getCapacityPercentage(centre) {
    const capacity = Number(
      centre.capacity || 0
    );

    const booked = Number(
      centre.booked || 0
    );

    if (!capacity) return 0;

    return Math.min(
      100,
      Math.round((booked / capacity) * 100)
    );
  }

  function getCapacityStatus(centre) {
    const percentage =
      getCapacityPercentage(centre);

    if (percentage >= 100) {
      return {
        label: "Full",
        className: "full",
      };
    }

    if (percentage >= 75) {
      return {
        label: "Almost Full",
        className: "warning",
      };
    }

    return {
      label: "Available",
      className: "available",
    };
  }

  function getOperatorName(centre) {
    if (!centre.operator) {
      return "Not assigned";
    }

    if (typeof centre.operator === "string") {
      return "Assigned";
    }

    return (
      centre.operator.name ||
      centre.operator.employeeId ||
      "Assigned"
    );
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
  }

  if (loading) {
    return (
      <>
        <style>{`
          .centres-loading {
            min-height: 360px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #66736d;
            font-size: 15px;
          }

          .centres-loader {
            width: 34px;
            height: 34px;
            border: 3px solid #dfe7e2;
            border-top-color: #2f6f4e;
            border-radius: 50%;
            animation: centresSpin .8s linear infinite;
          }

          @keyframes centresSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <div className="centres-loading">
          <div className="centres-loader" />
          <span>Loading procurement centres...</span>
        </div>
      </>
    );
  }

  return (
    <div className="centres-page">
      <style>{`
        .centres-page {
          width: 100%;
          min-height: 100%;
          padding-bottom: 42px;
          color: #17231f;
        }

        .centres-page * {
          box-sizing: border-box;
        }

        /* =========================
           HERO
        ========================= */

        .centres-hero {
          position: relative;
          overflow: hidden;
          margin-bottom: 22px;
          padding: 28px 30px;
          border: 1px solid #e1e7e3;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 90% 10%,
              rgba(63, 113, 84, .08),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f7f9f8 55%,
              #f1f6f3 100%
            );
          box-shadow:
            0 8px 24px rgba(26, 47, 37, .05);
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .centres-hero:hover {
          transform: translateY(-2px);
          border-color: #d5dfd9;
          box-shadow:
            0 16px 34px rgba(26, 47, 37, .08);
        }

        .centres-hero::after {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          right: -65px;
          top: -80px;
          border: 1px solid rgba(47, 111, 78, .08);
          border-radius: 50%;
          pointer-events: none;
        }

        .centres-between {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .centres-kicker {
          margin-bottom: 7px;
          color: #64806f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .centres-hero h1 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #17231f;
          font-size: clamp(27px, 2.5vw, 34px);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .centres-hero h1 svg {
          width: 27px;
          height: 27px;
          flex: 0 0 auto;
          color: #2f6f4e;
        }

        .centres-hero p {
          margin: 8px 0 0;
          max-width: 620px;
          color: #718078;
          font-size: 14px;
          line-height: 1.6;
        }

        .centres-primary-btn {
          border: 0;
          border-radius: 11px;
          padding: 12px 18px;
          background: #2f6f4e;
          color: #fff;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 7px 16px rgba(47, 111, 78, .18);
          transition:
            transform .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .centres-primary-btn:hover {
          transform: translateY(-2px);
          background: #285f42;
          box-shadow: 0 11px 22px rgba(47, 111, 78, .24);
        }

        .centres-primary-btn:active {
          transform: translateY(0);
        }

        /* =========================
           SUMMARY
        ========================= */

        .centres-summary {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 22px;
        }

        .centre-summary-card {
          position: relative;
          overflow: hidden;
          min-height: 118px;
          padding: 18px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
          box-shadow:
            0 6px 18px rgba(28, 45, 36, .045);
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .centre-summary-card:hover {
          transform: translateY(-5px);
          border-color: #d4ded8;
          box-shadow:
            0 15px 30px rgba(28, 45, 36, .09);
        }

        .centre-summary-card::after {
          content: "";
          position: absolute;
          right: -28px;
          bottom: -35px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #f6f8f7;
          pointer-events: none;
        }

        .summary-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f0f4f2;
          color: #496358;
          font-size: 18px;
          transition:
            transform .25s ease,
            background .25s ease;
        }

        .centre-summary-card:hover .summary-icon {
          transform: scale(1.07);
          background: #eaf2ed;
        }

        .summary-number {
          margin-top: 13px;
          color: #1a2821;
          font-size: 26px;
          line-height: 1;
          font-weight: 800;
        }

        .summary-label {
          margin-top: 7px;
          color: #7b8781;
          font-size: 12px;
          font-weight: 600;
        }

        .summary-card-open .summary-icon {
          background: #edf7f0;
          color: #2f7d4d;
        }

        .summary-card-closed .summary-icon {
          background: #faf0f0;
          color: #b25b5b;
        }

        .summary-card-capacity .summary-icon {
          background: #eef4fa;
          color: #426b94;
        }

        .summary-capacity {
          margin-top: 5px;
          color: #7b8781;
          font-size: 11px;
          font-weight: 600;
        }

        .summary-capacity strong {
          color: #426b94;
          font-weight: 800;
        }

        /* =========================
           FORM
        ========================= */

        .centre-form-card {
          margin-bottom: 22px;
          padding: 23px;
          border: 1px solid #dfe7e2;
          border-radius: 18px;
          background: #fff;
          box-shadow:
            0 8px 24px rgba(28, 45, 36, .06);
          animation: centreFormIn .25s ease;
        }

        @keyframes centreFormIn {
          from {
            opacity: 0;
            transform: translateY(-7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .centre-form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid #edf1ef;
        }

        .centre-form-kicker {
          margin-bottom: 5px;
          color: #6e8278;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }

        .centre-form-header h2 {
          margin: 0;
          color: #1c2a23;
          font-size: 20px;
          font-weight: 800;
        }

        .centre-form-description {
          margin: 5px 0 0;
          color: #7a8780;
          font-size: 12px;
        }

        .centre-form-close {
          width: 34px;
          height: 34px;
          border: 1px solid #e1e7e3;
          border-radius: 9px;
          background: #f8faf9;
          color: #66736d;
          cursor: pointer;
          font-size: 16px;
          transition:
            background .2s ease,
            color .2s ease,
            transform .2s ease;
        }

        .centre-form-close:hover {
          background: #f0f4f2;
          color: #1f2c26;
          transform: rotate(3deg);
        }

        .centre-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .centre-field {
          min-width: 0;
        }

        .centre-field-full {
          grid-column: 1 / -1;
        }

        .centre-field label {
          display: block;
          margin-bottom: 7px;
          color: #394840;
          font-size: 12px;
          font-weight: 750;
        }

        .centre-field input,
        .centre-field select,
        .centre-field textarea {
          width: 100%;
          min-height: 43px;
          padding: 10px 12px;
          border: 1px solid #dce4df;
          border-radius: 10px;
          outline: none;
          background: #fbfcfb;
          color: #24332b;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .centre-field textarea {
          min-height: 82px;
          resize: vertical;
        }

        .centre-field input::placeholder,
        .centre-field textarea::placeholder {
          color: #a0aaa5;
        }

        .centre-field input:hover,
        .centre-field select:hover,
        .centre-field textarea:hover {
          border-color: #c9d6cf;
          background: #fff;
        }

        .centre-field input:focus,
        .centre-field select:focus,
        .centre-field textarea:focus {
          border-color: #5d8c70;
          background: #fff;
          box-shadow:
            0 0 0 3px rgba(47, 111, 78, .09);
        }

        .centre-field-hint {
          margin-top: 5px;
          color: #929c97;
          font-size: 10px;
          line-height: 1.4;
        }

        .centre-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #edf1ef;
        }

        .centre-secondary-btn {
          min-width: 92px;
          padding: 10px 15px;
          border: 1px solid #dce4df;
          border-radius: 10px;
          background: #fff;
          color: #596760;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .centre-secondary-btn:hover {
          transform: translateY(-1px);
          border-color: #cbd7d0;
          background: #f7f9f8;
        }

        .centre-save-btn {
          min-width: 125px;
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          background: #2f6f4e;
          color: #fff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background .2s ease,
            transform .2s ease,
            box-shadow .2s ease;
        }

        .centre-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #285f42;
          box-shadow:
            0 7px 16px rgba(47, 111, 78, .18);
        }

        .centre-save-btn:disabled,
        .centre-secondary-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* =========================
           TOOLBAR
        ========================= */

        .centre-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
        }

        .centre-search {
          position: relative;
          flex: 1;
          max-width: 470px;
        }

        .centre-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a9690;
          font-size: 14px;
          pointer-events: none;
        }

        .centre-search input {
          width: 100%;
          height: 42px;
          padding: 0 38px 0 37px;
          border: 1px solid #dce4df;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #27362e;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .centre-search input:focus {
          border-color: #79a087;
          box-shadow:
            0 0 0 3px rgba(47, 111, 78, .08);
        }

        .centre-search input::placeholder {
          color: #9aa49f;
        }

        .centre-search-clear {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 25px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #87928d;
          cursor: pointer;
        }

        .centre-search-clear:hover {
          background: #f0f3f1;
          color: #435149;
        }

        .centre-filter {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px;
          border: 1px solid #e0e6e2;
          border-radius: 11px;
          background: #f7f9f8;
        }

        .centre-filter button {
          min-height: 32px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #7a8780;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background .2s ease,
            color .2s ease,
            box-shadow .2s ease;
        }

        .centre-filter button:hover {
          color: #3f5047;
          background: #fff;
        }

        .centre-filter button.active {
          background: #fff;
          color: #2f6f4e;
          box-shadow:
            0 2px 7px rgba(29, 48, 38, .08);
        }

        .centre-filter button.open-filter.active {
          color: #2f7d4d;
        }

        .centre-filter button.closed-filter.active {
          color: #a65c5c;
        }

        .filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          margin-left: 4px;
          padding: 0 4px;
          border-radius: 5px;
          background: #eef2ef;
          font-size: 9px;
          font-weight: 800;
        }

        .centre-filter button.active .filter-count {
          background: #edf5ef;
          color: #2f6f4e;
        }

        .centre-result-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 8px 1px 15px;
          color: #849089;
          font-size: 11px;
        }

        .centre-result-info strong {
          color: #536158;
          font-weight: 800;
        }

        .clear-filters-btn {
          border: 0;
          background: transparent;
          color: #3f7255;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .clear-filters-btn:hover {
          text-decoration: underline;
        }

        /* =========================
           CARDS
        ========================= */

        .centres-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .centre-management-card {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 18px;
          border: 1px solid #dfe6e1;
          border-radius: 17px;
          background: #fff;
          box-shadow:
            0 6px 18px rgba(29, 47, 37, .045);
          cursor: pointer;
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .centre-management-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: #dce8e0;
          transition: background .25s ease;
        }

        .centre-management-card:hover {
          transform: translateY(-5px);
          border-color: #cfdcd4;
          box-shadow:
            0 17px 34px rgba(29, 47, 37, .10);
        }

        .centre-management-card:hover::before {
          background: #2f6f4e;
        }

        .centre-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .centre-card-title {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          min-width: 0;
        }

        .centre-building-icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 10px;
          background: #edf4ef;
          color: #2f6f4e;
          transition:
            transform .25s ease,
            background .25s ease;
        }

        .centre-building-icon svg {
          width: 19px;
          height: 19px;
        }

        .centre-management-card:hover
        .centre-building-icon {
          transform: scale(1.07);
          background: #e6f0e9;
        }

        .centre-title-text {
          min-width: 0;
        }

        .centre-title-text h3 {
          margin: 1px 0 4px;
          overflow: hidden;
          color: #24332b;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .centre-district {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #849089;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .centre-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          padding: 6px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .2px;
        }

        .centre-status .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .centre-status.open {
          background: #edf7f0;
          color: #2f7d4d;
        }

        .centre-status.open .status-dot {
          background: #45a463;
        }

        .centre-status.closed {
          background: #faf0f0;
          color: #a45b5b;
        }

        .centre-status.closed .status-dot {
          background: #bd6969;
        }

        /* =========================
           CAPACITY
        ========================= */

        .centre-capacity-box {
          margin-bottom: 15px;
          padding: 13px;
          border: 1px solid #edf1ee;
          border-radius: 12px;
          background: #f8faf9;
          transition:
            background .2s ease,
            border-color .2s ease;
        }

        .centre-management-card:hover
        .centre-capacity-box {
          border-color: #e1e9e4;
          background: #f6f9f7;
        }

        .centre-capacity-top,
        .centre-capacity-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .centre-capacity-label {
          color: #79867f;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .centre-capacity-value {
          color: #293930;
          font-size: 12px;
          font-weight: 800;
        }

        .centre-capacity-value span {
          color: #99a39e;
          font-weight: 600;
        }

        .capacity-badge {
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
        }

        .capacity-badge.available {
          background: #edf7f0;
          color: #35774d;
        }

        .capacity-badge.warning {
          background: #fff6e7;
          color: #9a6a22;
        }

        .capacity-badge.full {
          background: #faf0f0;
          color: #a05252;
        }

        .centre-capacity-progress {
          width: 100%;
          height: 6px;
          margin: 10px 0 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #e7ece9;
        }

        .centre-capacity-progress-bar {
          height: 100%;
          border-radius: inherit;
          background: #5c8c6d;
          transition: width .5s ease;
        }

        .centre-capacity-progress-bar.warning {
          background: #c79645;
        }

        .centre-capacity-progress-bar.full {
          background: #ba6666;
        }

        .centre-capacity-bottom {
          color: #8a9590;
          font-size: 10px;
        }

        .centre-capacity-bottom strong {
          color: #56645c;
          font-weight: 800;
        }

        /* =========================
           DETAILS
        ========================= */

        .centre-details {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 7px;
          margin-bottom: 15px;
        }

        .centre-detail {
          min-width: 0;
          padding: 9px 8px;
          border-radius: 9px;
          background: #f8faf9;
          transition:
            transform .2s ease,
            background .2s ease;
        }

        .centre-management-card:hover
        .centre-detail {
          background: #f4f8f5;
        }

        .centre-detail-label {
          margin-bottom: 4px;
          color: #909b95;
          font-size: 9px;
          font-weight: 700;
        }

        .centre-detail-value {
          overflow: hidden;
          color: #405047;
          font-size: 10px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .centre-crops {
          min-height: 24px;
          margin-bottom: 14px;
        }

        .centre-crop-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .centre-crop-chip {
          max-width: 100%;
          padding: 4px 7px;
          overflow: hidden;
          border: 1px solid #e1e9e4;
          border-radius: 6px;
          background: #f6f9f7;
          color: #637169;
          font-size: 9px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .centre-no-crops {
          color: #a0aaa5;
          font-size: 10px;
          font-style: italic;
        }

        .centre-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
          padding: 8px 9px;
          border-radius: 8px;
          background: #f8faf9;
          color: #77847d;
          font-size: 10px;
        }

        .centre-location strong {
          color: #4f5e55;
          font-weight: 750;
        }

        .centre-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid #edf1ef;
        }

        .centre-edit-hint {
          color: #a0aaa5;
          font-size: 9px;
        }

        .centre-edit-btn {
          padding: 7px 10px;
          border: 1px solid #dce6df;
          border-radius: 8px;
          background: #fff;
          color: #47715a;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .centre-edit-btn:hover {
          transform: translateY(-1px);
          border-color: #c9d9cf;
          background: #f3f8f5;
        }

        /* =========================
           EMPTY
        ========================= */

        .centre-empty-state {
          padding: 58px 20px;
          border: 1px dashed #d8e1dc;
          border-radius: 17px;
          background: #fafcfb;
          text-align: center;
        }

        .centre-empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f0f4f2;
          color: #7f8d85;
          font-size: 20px;
        }

        .centre-empty-state h3 {
          margin: 0 0 5px;
          color: #3a4941;
          font-size: 15px;
          font-weight: 800;
        }

        .centre-empty-state p {
          margin: 0 0 15px;
          color: #8b9690;
          font-size: 11px;
        }

        .centre-empty-action {
          padding: 9px 14px;
          border: 1px solid #dce5df;
          border-radius: 9px;
          background: #fff;
          color: #3f7255;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .centre-empty-action:hover {
          transform: translateY(-1px);
          background: #f4f8f5;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1100px) {
          .centres-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .centres-summary {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .centres-between {
            align-items: flex-start;
            flex-direction: column;
          }

          .centres-primary-btn {
            width: 100%;
          }

          .centre-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .centre-search {
            max-width: none;
          }

          .centre-filter {
            width: 100%;
          }

          .centre-filter button {
            flex: 1;
          }
        }

        @media (max-width: 760px) {
          .centres-hero {
            padding: 23px 19px;
            border-radius: 16px;
          }

          .centres-hero h1 {
            font-size: 27px;
          }

          .centres-hero h1 svg {
            width: 23px;
            height: 23px;
          }

          .centres-summary {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .centre-summary-card {
            min-height: 105px;
            padding: 14px;
          }

          .summary-number {
            font-size: 22px;
          }

          .centre-form-card {
            padding: 17px;
          }

          .centre-form-grid {
            grid-template-columns: 1fr;
          }

          .centre-field-full {
            grid-column: auto;
          }

          .centres-grid {
            grid-template-columns: 1fr;
          }

          .centre-result-info {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .centres-summary {
            grid-template-columns: 1fr;
          }

          .centre-summary-card {
            min-height: 92px;
          }

          .centre-filter {
            overflow-x: auto;
          }

          .centre-filter button {
            flex: 0 0 auto;
            white-space: nowrap;
          }

          .centre-form-actions {
            flex-direction: column-reverse;
          }

          .centre-secondary-btn,
          .centre-save-btn {
            width: 100%;
          }

          .centre-details {
            grid-template-columns: 1fr 1fr;
          }

          .centre-details .centre-detail:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .centres-hero,
          .centre-summary-card,
          .centre-management-card,
          .centre-building-icon,
          .centre-capacity-box,
          .centre-primary-btn,
          .centre-save-btn,
          .centre-secondary-btn,
          .centre-edit-btn,
          .centre-empty-action {
            transition: none;
          }

          .centres-hero:hover,
          .centre-summary-card:hover,
          .centre-management-card:hover,
          .centres-primary-btn:hover,
          .centre-save-btn:hover,
          .centre-secondary-btn:hover,
          .centre-edit-btn:hover,
          .centre-empty-action:hover {
            transform: none;
          }
        }
      `}</style>

      {/* =========================
          HERO
      ========================= */}

      <section className="centres-hero">
        <div className="centres-between">
          <div>
            <div className="centres-kicker">
              ADMIN CONTROL CENTRE
            </div>

            <h1>
              <IconBuilding />
              Procurement Centres
            </h1>

            <p>
              Manage procurement centres, operators,
              capacity and accepted crops.
            </p>
          </div>

          <button
            type="button"
            className="centres-primary-btn"
            onClick={() =>
              showForm
                ? cancelForm()
                : startCreate()
            }
          >
            {showForm
              ? "Cancel"
              : "+ Add Centre"}
          </button>
        </div>
      </section>

      {/* =========================
          SUMMARY
      ========================= */}

      <section className="centres-summary">
        <div className="centre-summary-card">
          <div className="summary-top">
            <div className="summary-icon">
              <IconBuilding />
            </div>
          </div>

          <div className="summary-number">
            {centres.length}
          </div>

          <div className="summary-label">
            Total Centres
          </div>
        </div>

        <div className="centre-summary-card summary-card-open">
          <div className="summary-top">
            <div className="summary-icon">
              ●
            </div>
          </div>

          <div className="summary-number">
            {openCount}
          </div>

          <div className="summary-label">
            Open Centres
          </div>
        </div>

        <div className="centre-summary-card summary-card-closed">
          <div className="summary-top">
            <div className="summary-icon">
              ●
            </div>
          </div>

          <div className="summary-number">
            {closedCount}
          </div>

          <div className="summary-label">
            Closed Centres
          </div>
        </div>

        <div className="centre-summary-card summary-card-capacity">
          <div className="summary-top">
            <div className="summary-icon">
              ◫
            </div>
          </div>

          <div className="summary-number">
            {totalCapacity}
          </div>

          <div className="summary-label">
            Total Token Capacity
          </div>

          <div className="summary-capacity">
            Booked:{" "}
            <strong>
              {totalBooked}/{totalCapacity}
            </strong>
          </div>
        </div>
      </section>

      {/* =========================
          FORM
      ========================= */}

      {showForm && (
        <section className="centre-form-card">
          <div className="centre-form-header">
            <div>
              <div className="centre-form-kicker">
                {editingId
                  ? "UPDATE CENTRE"
                  : "NEW CENTRE"}
              </div>

              <h2>
                {editingId
                  ? "Edit Procurement Centre"
                  : "Create Procurement Centre"}
              </h2>

              <p className="centre-form-description">
                Configure centre details,
                capacity, crops and operator.
              </p>
            </div>

            <button
              type="button"
              className="centre-form-close"
              onClick={cancelForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="centre-form-grid">

              <div className="centre-field">
                <label htmlFor="centre-name">
                  Centre Name
                </label>

                <input
                  id="centre-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    update(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Enter centre name"
                />
              </div>

              <div className="centre-field">
                <label htmlFor="centre-district">
                  District
                </label>

                <input
                  id="centre-district"
                  type="text"
                  value={form.district}
                  onChange={(e) =>
                    update(
                      "district",
                      e.target.value
                    )
                  }
                  placeholder="Enter district"
                />
              </div>

              <div className="centre-field">
                <label htmlFor="centre-capacity">
                  Daily Token Capacity
                </label>

                <input
                  id="centre-capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    update(
                      "capacity",
                      e.target.value
                    )
                  }
                />

                <div className="centre-field-hint">
                  Maximum procurement tokens
                  accepted per day.
                </div>
              </div>

              <div className="centre-field">
                <label htmlFor="centre-counters">
                  Counters
                </label>

                <input
                  id="centre-counters"
                  type="number"
                  min="1"
                  value={form.counters}
                  onChange={(e) =>
                    update(
                      "counters",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="centre-field">
                <label htmlFor="centre-latitude">
                  Latitude
                </label>

                <input
                  id="centre-latitude"
                  type="text"
                  value={form.latitude}
                  onChange={(e) =>
                    update(
                      "latitude",
                      e.target.value
                    )
                  }
                  placeholder="e.g. 28.6139"
                />
              </div>

              <div className="centre-field">
                <label htmlFor="centre-longitude">
                  Longitude
                </label>

                <input
                  id="centre-longitude"
                  type="text"
                  value={form.longitude}
                  onChange={(e) =>
                    update(
                      "longitude",
                      e.target.value
                    )
                  }
                  placeholder="e.g. 77.2090"
                />
              </div>

              <div className="centre-field">
                <label htmlFor="centre-operator">
                  Assigned Operator
                </label>

                <select
                  id="centre-operator"
                  value={form.operatorId}
                  onChange={(e) =>
                    update(
                      "operatorId",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    No operator assigned
                  </option>

                  {operators.map((operator) => {
                    const assignedToOther =
                      operator.centre &&
                      operator.centre !==
                        editingId;

                    return (
                      <option
                        key={operator._id}
                        value={operator._id}
                        disabled={
                          assignedToOther
                        }
                      >
                        {operator.name ||
                          operator.employeeId ||
                          "Operator"}
                        {operator.employeeId
                          ? ` • ${operator.employeeId}`
                          : ""}
                        {assignedToOther
                          ? " • Already assigned"
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="centre-field">
                <label htmlFor="centre-crops">
                  Accepted Crops
                </label>

                <input
                  id="centre-crops"
                  type="text"
                  value={form.cropList}
                  onChange={(e) =>
                    update(
                      "cropList",
                      e.target.value
                    )
                  }
                  placeholder="Wheat, Rice, Maize"
                />

                <div className="centre-field-hint">
                  Separate multiple crops with
                  commas.
                </div>
              </div>
            </div>

            <div className="centre-form-actions">
              <button
                type="button"
                className="centre-secondary-btn"
                onClick={cancelForm}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="centre-save-btn"
                disabled={busy}
              >
                {busy
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Centre"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================
          TOOLBAR
      ========================= */}

      <section className="centre-toolbar">
        <div className="centre-search">
          <span className="centre-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search centre, district, operator or crop..."
          />

          {search && (
            <button
              type="button"
              className="centre-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="centre-filter">
          <button
            type="button"
            className={
              statusFilter === "ALL"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            All
            <span className="filter-count">
              {centres.length}
            </span>
          </button>

          <button
            type="button"
            className={`open-filter ${
              statusFilter === "OPEN"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("OPEN")
            }
          >
            Open
            <span className="filter-count">
              {openCount}
            </span>
          </button>

          <button
            type="button"
            className={`closed-filter ${
              statusFilter === "CLOSED"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("CLOSED")
            }
          >
            Closed
            <span className="filter-count">
              {closedCount}
            </span>
          </button>
        </div>
      </section>

      {/* =========================
          RESULT INFO
      ========================= */}

      <div className="centre-result-info">
        <span>
          Showing{" "}
          <strong>
            {filteredCentres.length}
          </strong>{" "}
          of{" "}
          <strong>
            {centres.length}
          </strong>{" "}
          centres
        </span>

        {(search ||
          statusFilter !== "ALL") && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* =========================
          CENTRE CARDS
      ========================= */}

      {filteredCentres.length > 0 ? (
        <section className="centres-grid">
          {filteredCentres.map((centre) => {
            const percentage =
              getCapacityPercentage(
                centre
              );

            const capacityStatus =
              getCapacityStatus(
                centre
              );

            const crops =
              centre.cropList || [];

            return (
              <article
                key={centre._id}
                className="centre-management-card"
                onClick={() =>
                  startEdit(centre)
                }
              >
                <div className="centre-card-header">
                  <div className="centre-card-title">
                    <div className="centre-building-icon">
                      <IconBuilding />
                    </div>

                    <div className="centre-title-text">
                      <h3 title={centre.name}>
                        {centre.name ||
                          "Unnamed Centre"}
                      </h3>

                      <div className="centre-district">
                        <span>⌖</span>
                        <span>
                          {centre.district ||
                            "District not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`centre-status ${
                      centre.status === "OPEN"
                        ? "open"
                        : "closed"
                    }`}
                  >
                    <span className="status-dot" />

                    {centre.status ===
                    "OPEN"
                      ? "OPEN"
                      : "CLOSED"}
                  </div>
                </div>

                {/* Capacity */}

                <div className="centre-capacity-box">
                  <div className="centre-capacity-top">
                    <span className="centre-capacity-label">
                      Daily Capacity
                    </span>

                    <span className="centre-capacity-value">
                      {Number(
                        centre.booked || 0
                      )}
                      <span>
                        {" "}
                        /{" "}
                        {Number(
                          centre.capacity || 0
                        )}
                      </span>
                    </span>
                  </div>

                  <div className="centre-capacity-progress">
                    <div
                      className={`centre-capacity-progress-bar ${
                        capacityStatus.className
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="centre-capacity-bottom">
                    <span>
                      Utilization{" "}
                      <strong>
                        {percentage}%
                      </strong>
                    </span>

                    <span
                      className={`capacity-badge ${capacityStatus.className}`}
                    >
                      {capacityStatus.label}
                    </span>
                  </div>
                </div>

                {/* Details */}

                <div className="centre-details">
                  <div className="centre-detail">
                    <div className="centre-detail-label">
                      Operator
                    </div>

                    <div
                      className="centre-detail-value"
                      title={getOperatorName(
                        centre
                      )}
                    >
                      {getOperatorName(
                        centre
                      )}
                    </div>
                  </div>

                  <div className="centre-detail">
                    <div className="centre-detail-label">
                      Counters
                    </div>

                    <div className="centre-detail-value">
                      {centre.counters ||
                        0}
                    </div>
                  </div>

                  <div className="centre-detail">
                    <div className="centre-detail-label">
                      Booked
                    </div>

                    <div className="centre-detail-value">
                      {centre.booked || 0}
                    </div>
                  </div>
                </div>

                {/* Crops */}

                <div className="centre-crops">
                  {crops.length > 0 ? (
                    <div className="centre-crop-list">
                      {crops
                        .slice(0, 5)
                        .map(
                          (
                            crop,
                            index
                          ) => (
                            <span
                              key={`${crop}-${index}`}
                              className="centre-crop-chip"
                            >
                              {crop}
                            </span>
                          )
                        )}

                      {crops.length > 5 && (
                        <span className="centre-crop-chip">
                          +{crops.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="centre-no-crops">
                      No crops configured
                    </span>
                  )}
                </div>

                {/* Location */}

                {(centre.latitude ||
                  centre.longitude) && (
                  <div className="centre-location">
                    <span>⌖</span>

                    <span>
                      Location:{" "}
                      <strong>
                        {centre.latitude ||
                          "—"}
                        {", "}
                        {centre.longitude ||
                          "—"}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Footer */}

                <div className="centre-card-footer">
                  <span className="centre-edit-hint">
                    Click card to edit
                  </span>

                  <button
                    type="button"
                    className="centre-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(centre);
                    }}
                  >
                    Edit Centre
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="centre-empty-state">
          <div className="centre-empty-icon">
            ⌕
          </div>

          <h3>
            No centres found
          </h3>

          <p>
            Try changing your search or
            filter, or create a new
            procurement centre.
          </p>

          {(search ||
            statusFilter !== "ALL") ? (
            <button
              type="button"
              className="centre-empty-action"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              className="centre-empty-action"
              onClick={startCreate}
            >
              + Add Centre
            </button>
          )}
        </div>
      )}
    </div>
  );
}