import { useEffect, useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { money } from "../../utils/format";
import { IconChart } from "../../components/icons.jsx";

const GREEN = "#2f6f4e";
const GREEN_DARK = "#24583d";
const GREEN_2 = "#4f8063";
const GREEN_3 = "#76a087";
const GREEN_4 = "#9dbba7";

const GREEN_LIGHT = "#edf6f0";
const GREEN_SOFT = "#f7faf8";

const BORDER = "#dce8df";
const TEXT = "#1d2d24";
const MUTED = "#718078";

const COLORS = [
  "#2f6f4e",
  "#4f8063",
  "#76a087",
  "#8fac98",
  "#b0c6b6",
  "#d0ded4",
];

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
}

function CustomTooltip({
  active,
  payload,
  label,
  type,
}) {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div
      style={{
        minWidth: 145,
        padding: "11px 13px",
        borderRadius: 11,
        border:
          `1px solid ${BORDER}`,
        background:
          "rgba(255,255,255,.98)",
        boxShadow:
          "0 10px 28px rgba(29,52,39,.12)",
      }}
    >
      <div
        style={{
          marginBottom: 7,
          color: "#668074",
          fontSize: 9,
          fontWeight: 800,
          textTransform:
            "uppercase",
          letterSpacing: ".6px",
        }}
      >
        {label}
      </div>

      {payload.map(
        (item, index) => {
          let value = item.value;

          if (type === "money") {
            value = money(value);
          } else if (
            type === "weight"
          ) {
            value = `${Math.round(
              value || 0
            ).toLocaleString(
              "en-IN"
            )} kg`;
          } else {
            value = Number(
              value || 0
            ).toLocaleString(
              "en-IN"
            );
          }

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 18,
                paddingTop: 4,
                color: "#68776f",
                fontSize: 10,
              }}
            >
              <span>
                {item.name}
              </span>

              <strong
                style={{
                  color: GREEN,
                  fontWeight: 850,
                }}
              >
                {value}
              </strong>
            </div>
          );
        }
      )}
    </div>
  );
}

function HoverCard({
  children,
  style = {},
}) {
  const [hover, setHover] =
    useState(false);

  return (
    <div
      onMouseEnter={() =>
        setHover(true)
      }
      onMouseLeave={() =>
        setHover(false)
      }
      style={{
        ...style,
        transform: hover
          ? "translateY(-4px)"
          : "translateY(0)",
        borderColor: hover
          ? "#c7dccd"
          : BORDER,
        boxShadow: hover
          ? "0 15px 32px rgba(29,52,39,.09)"
          : "0 6px 19px rgba(29,52,39,.045)",
        transition:
          "all .22s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function Analytics() {
  const toast = useToast();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    api
      .getAnalytics()
      .then(setData)
      .catch((err) =>
        toast(err.message)
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  /* =====================================================
     DATA
  ===================================================== */

  const statusData = useMemo(() => {
    if (!data?.statusBreakdown) {
      return [];
    }

    return data.statusBreakdown.map(
      (s) => ({
        name: formatStatus(s._id),
        value: s.count || 0,
      })
    );
  }, [data]);

  const cropData = useMemo(() => {
    if (!data?.cropRevenue) {
      return [];
    }

    return data.cropRevenue.map(
      (c) => ({
        name:
          c._id || "Unknown",
        revenue:
          c.revenue || 0,
        weight:
          c.weight || 0,
      })
    );
  }, [data]);

  const centreData = useMemo(() => {
    if (!data?.centreVolume) {
      return [];
    }

    return data.centreVolume.map(
      (c) => ({
        name:
          c.name || "Unknown",
        count:
          c.count || 0,
      })
    );
  }, [data]);

  const trendData = useMemo(() => {
    if (!data?.last7Days) {
      return [];
    }

    return data.last7Days.map(
      (d) => ({
        date:
          d._id?.slice(5) || "-",
        count:
          d.count || 0,
      })
    );
  }, [data]);

  const stats = useMemo(() => {
    const totals =
      data?.totals || {};

    const totalBookings =
      Number(
        totals.totalBookings ||
          0
      );

    const totalWeight =
      Number(
        totals.totalWeight ||
          0
      );

    const totalRevenue =
      Number(
        totals.totalRevenue ||
          0
      );

    const successful =
      statusData.find(
        (item) =>
          item.name.toLowerCase() ===
            "confirmed" ||
          item.name.toLowerCase() ===
            "completed" ||
          item.name.toLowerCase() ===
            "success"
      )?.value || 0;

    const successRate =
      totalBookings > 0
        ? Math.round(
            (successful /
              totalBookings) *
              100
          )
        : 0;

    const averageWeight =
      totalBookings > 0
        ? totalWeight /
          totalBookings
        : 0;

    return {
      totalBookings,
      totalWeight,
      totalRevenue,
      activeCrops:
        cropData.length,
      successRate,
      averageWeight,
    };
  }, [
    data,
    statusData,
    cropData,
  ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div
        style={{
          minHeight: 340,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexDirection:
            "column",
          gap: 13,
          color: MUTED,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius:
              "50%",
            border:
              `3px solid ${GREEN_LIGHT}`,
            borderTopColor:
              GREEN,
          }}
        />

        <strong
          style={{
            color: TEXT,
            fontSize: 14,
          }}
        >
          Loading analytics
        </strong>

        <span
          style={{
            color: "#89968e",
            fontSize: 11,
          }}
        >
          Preparing procurement
          insights...
        </span>
      </div>
    );
  }

  /* =====================================================
     EMPTY
  ===================================================== */

  if (!data) {
    return (
      <div
        style={{
          minHeight: 340,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexDirection:
            "column",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            display: "grid",
            placeItems:
              "center",
            borderRadius: 16,
            background:
              GREEN_LIGHT,
            color: GREEN,
          }}
        >
          <IconChart
            style={{
              width: 27,
              height: 27,
            }}
          />
        </div>

        <h3
          style={{
            margin:
              "14px 0 5px",
            color: TEXT,
            fontSize: 16,
          }}
        >
          No analytics available
        </h3>

        <p
          style={{
            maxWidth: 430,
            margin: 0,
            color: MUTED,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          There is currently
          no procurement data
          available to generate
          analytics.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        paddingBottom: 40,
        boxSizing: "border-box",
        color: TEXT,
      }}
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <HoverCard
        style={{
          position:
            "relative",
          overflow:
            "hidden",
          marginBottom: 20,
          padding:
            "29px 32px",
          borderRadius: 20,
          border:
            `1px solid ${BORDER}`,
          background:
            "linear-gradient(135deg,#ffffff 0%,#f3faf5 100%)",
        }}
      >
        <div
          style={{
            position:
              "absolute",
            right: -80,
            bottom: -120,
            width: 240,
            height: 240,
            borderRadius:
              "50%",
            border:
              "35px solid rgba(47,111,78,.055)",
            pointerEvents:
              "none",
          }}
        />

        <div
          style={{
            position:
              "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 8,
              marginBottom: 9,
              color: GREEN,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform:
                "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius:
                  "50%",
                background:
                  GREEN,
              }}
            />

            PROCUREMENT
            INTELLIGENCE
          </div>

          <h1
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 10,
              margin: 0,
              color: "#18271f",
              fontSize: 32,
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: -.8,
            }}
          >
            <IconChart
              style={{
                width: 28,
                height: 28,
                color: GREEN,
              }}
            />

            Analytics
          </h1>

          <p
            style={{
              maxWidth: 700,
              margin:
                "9px 0 0",
              color: MUTED,
              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            Monitor procurement
            performance across
            bookings, collection
            centres, crops,
            revenue and payment
            operations.
          </p>
        </div>
      </HoverCard>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,minmax(0,1fr))",
          gap: 14,
          marginBottom: 17,
        }}
      >
        {[
          {
            label:
              "Total Bookings",
            value:
              stats.totalBookings.toLocaleString(
                "en-IN"
              ),
            meta:
              "All procurement bookings",
            icon: "#",
          },
          {
            label:
              "Weight Procured",
            value: `${Math.round(
              stats.totalWeight
            ).toLocaleString(
              "en-IN"
            )} kg`,
            meta:
              "Total quantity collected",
            icon: "KG",
          },
          {
            label:
              "Total Revenue",
            value:
              money(
                stats.totalRevenue
              ),
            meta:
              "Procurement transaction value",
            icon: "₹",
          },
          {
            label:
              "Active Crops",
            value:
              stats.activeCrops,
            meta:
              "Crop categories",
            icon: "W",
          },
        ].map((item) => (
          <HoverCard
            key={item.label}
            style={{
              position:
                "relative",
              overflow:
                "hidden",
              minWidth: 0,
              padding: 18,
              borderRadius: 16,
              border:
                `1px solid ${BORDER}`,
              background:
                "#fff",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  13,
              }}
            >
              <span
                style={{
                  color:
                    MUTED,
                  fontSize: 10,
                  fontWeight:
                    800,
                }}
              >
                {item.label}
              </span>

              <span
                style={{
                  width: 35,
                  height: 35,
                  display:
                    "grid",
                  placeItems:
                    "center",
                  borderRadius:
                    10,
                  background:
                    GREEN_LIGHT,
                  color: GREEN,
                  fontSize: 11,
                  fontWeight:
                    850,
                }}
              >
                {item.icon}
              </span>
            </div>

            <div
              style={{
                color:
                  GREEN_DARK,
                fontSize: 25,
                fontWeight: 850,
                lineHeight: 1.1,
                whiteSpace:
                  "nowrap",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                marginTop: 7,
                color:
                  "#8b9790",
                fontSize: 10,
              }}
            >
              {item.meta}
            </div>
          </HoverCard>
        ))}
      </section>

      {/* =====================================================
          SECONDARY STATS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        {[
          {
            label:
              "Booking success rate",
            value:
              `${stats.successRate}%`,
            badge:
              "Performance",
          },
          {
            label:
              "Average booking weight",
            value: `${Math.round(
              stats.averageWeight
            ).toLocaleString(
              "en-IN"
            )} kg`,
            badge:
              "Per booking",
          },
        ].map((item) => (
          <HoverCard
            key={item.label}
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 15,
              padding:
                "16px 19px",
              borderRadius:
                14,
              border:
                `1px solid ${BORDER}`,
              background:
                GREEN_SOFT,
            }}
          >
            <div>
              <div
                style={{
                  color:
                    MUTED,
                  fontSize: 10,
                  fontWeight:
                    800,
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    ".6px",
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: 5,
                  color:
                    GREEN_DARK,
                  fontSize: 20,
                  fontWeight:
                    850,
                }}
              >
                {item.value}
              </div>
            </div>

            <span
              style={{
                flexShrink: 0,
                padding:
                  "7px 10px",
                borderRadius:
                  999,
                background:
                  GREEN_LIGHT,
                color:
                  GREEN,
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              {item.badge}
            </span>
          </HoverCard>
        ))}
      </section>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 16,
        }}
      >
        {/* BOOKING ACTIVITY */}

        <HoverCard
          style={{
            gridColumn:
              "span 2",
            minWidth: 0,
            borderRadius:
              17,
            border:
              `1px solid ${BORDER}`,
            background:
              "#fff",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 15,
              padding:
                "18px 20px 4px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    TEXT,
                  fontSize: 14,
                  fontWeight:
                    850,
                }}
              >
                Booking Activity
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#8a9690",
                  fontSize: 10,
                }}
              >
                Procurement bookings
                over the last 7 days
              </p>
            </div>

            <span
              style={{
                padding:
                  "6px 9px",
                borderRadius: 7,
                background:
                  GREEN_LIGHT,
                color:
                  GREEN,
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              7 DAYS
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: 285,
              padding:
                "10px 14px 14px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={trendData}
                margin={{
                  top: 12,
                  right: 18,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  stroke="#e1ebe4"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="count"
                  name="Bookings"
                  stroke={GREEN}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#fff",
                    stroke:
                      GREEN,
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: GREEN,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </HoverCard>

        {/* BOOKING STATUS */}

        <HoverCard
          style={{
            minWidth: 0,
            borderRadius:
              17,
            border:
              `1px solid ${BORDER}`,
            background:
              "#fff",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 15,
              padding:
                "18px 20px 4px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    TEXT,
                  fontSize: 14,
                  fontWeight:
                    850,
                }}
              >
                Booking Status
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#8a9690",
                  fontSize: 10,
                }}
              >
                Current status
                distribution
              </p>
            </div>

            <span
              style={{
                padding:
                  "6px 9px",
                borderRadius: 7,
                background:
                  GREEN_LIGHT,
                color:
                  GREEN,
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              BREAKDOWN
            </span>
          </div>

          <div
            style={{
              height: 285,
              padding:
                "5px 12px 12px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={53}
                  outerRadius={82}
                  paddingAngle={3}
                  label={({
                    name,
                    percent,
                  }) =>
                    `${name} ${(
                      percent * 100
                    ).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {statusData.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: 10,
                    color: MUTED,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </HoverCard>

        {/* REVENUE BY CROP */}

        <HoverCard
          style={{
            minWidth: 0,
            borderRadius:
              17,
            border:
              `1px solid ${BORDER}`,
            background:
              "#fff",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 15,
              padding:
                "18px 20px 4px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    TEXT,
                  fontSize: 14,
                  fontWeight:
                    850,
                }}
              >
                Revenue by Crop
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#8a9690",
                  fontSize: 10,
                }}
              >
                Revenue contribution
                by crop
              </p>
            </div>

            <span
              style={{
                padding:
                  "6px 9px",
                borderRadius: 7,
                background:
                  GREEN_LIGHT,
                color:
                  GREEN,
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              REVENUE
            </span>
          </div>

          <div
            style={{
              height: 285,
              padding:
                "10px 14px 14px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={cropData}
                margin={{
                  top: 15,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  stroke="#e1ebe4"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={
                    <CustomTooltip
                      type="money"
                    />
                  }
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill={GREEN}
                  radius={[
                    7,
                    7,
                    2,
                    2,
                  ]}
                  maxBarSize={46}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HoverCard>

        {/* CENTRE VOLUME */}

        <HoverCard
          style={{
            gridColumn:
              "span 2",
            minWidth: 0,
            borderRadius:
              17,
            border:
              `1px solid ${BORDER}`,
            background:
              "#fff",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 15,
              padding:
                "18px 20px 4px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    TEXT,
                  fontSize: 14,
                  fontWeight:
                    850,
                }}
              >
                Bookings by Collection Centre
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#8a9690",
                  fontSize: 10,
                }}
              >
                Procurement volume
                handled by each centre
              </p>
            </div>

            <span
              style={{
                padding:
                  "6px 9px",
                borderRadius: 7,
                background:
                  GREEN_LIGHT,
                color:
                  GREEN,
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              CENTRE VOLUME
            </span>
          </div>

          <div
            style={{
              height: 285,
              padding:
                "10px 14px 14px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={centreData}
                margin={{
                  top: 15,
                  right: 15,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  stroke="#e1ebe4"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: MUTED,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Bar
                  dataKey="count"
                  name="Bookings"
                  fill={GREEN_2}
                  radius={[
                    7,
                    7,
                    2,
                    2,
                  ]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HoverCard>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: 15,
          marginTop: 17,
          padding:
            "10px 3px 0",
          color: "#8b9790",
          fontSize: 10,
          flexWrap: "wrap",
        }}
      >
        <span>
          <strong
            style={{
              color:
                "#4d6758",
            }}
          >
            Analytics overview
          </strong>

          {" "}· Live procurement data
        </span>

        <span>
          {stats.totalBookings.toLocaleString(
            "en-IN"
          )}{" "}
          total records
        </span>
      </div>
    </div>
  );
}