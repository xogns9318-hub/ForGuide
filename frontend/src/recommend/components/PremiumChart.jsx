import { useTranslation } from "react-i18next";
import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import styles from "../recommend.module.css";

const CHART_COUNT = 5;
const ROW_HEIGHT = 44;
const PARTS = [
    { key: "basic", color: "var(--primary)" },
    { key: "rider1", color: "var(--brand)" },
    { key: "rider2", color: "var(--card-end)" },
];
const TOTAL_ONLY = [{ key: "total", color: "var(--primary)" }];

export default function PremiumChart({ items, sex, age, coverage }) {
    const { t } = useTranslation();
    const shown = items.slice(0, CHART_COUNT);
    const stacked = shown.length > 0 && shown.every((item) => item.premium_breakdown);
    const parts = stacked ? PARTS : TOTAL_ONLY;
    const data = shown.map((item) => ({
        name: item.company,
        total: item.monthly_premium,
        ...item.premium_breakdown,
    }));

    if (data.length === 0) return null;

    const top = Math.max(...data.map((row) => row.total));
    const last = parts[parts.length - 1].key;

    return (
        <figure className={styles.chart}>
            <figcaption>
                <strong>{t("recommendInsurance.chartTitle")}</strong>
                <span className="text-muted">
                    {t("recommendInsurance.chartBasis", {
                        sex: t(`recommendInsurance.sexOptions.${sex}`, { defaultValue: sex }),
                        age,
                    })}
                    {coverage && ` · ${t(`recommendInsurance.coverageOptions.${coverage}`)}`}
                </span>
            </figcaption>
            <ResponsiveContainer
                width="100%"
                height={data.length * ROW_HEIGHT + (stacked ? 36 : 0)}
            >
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 100, bottom: 0, left: 0 }}
                    barCategoryGap={12}
                >
                    <XAxis type="number" hide domain={[0, top]} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--ink)", fontSize: 14 }}
                    />
                    {stacked && (
                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={10}
                            formatter={(key) => (
                                <span style={{ color: "var(--ink)" }}>
                                    {t(`recommendInsurance.${key}`)}
                                </span>
                            )}
                        />
                    )}
                    {parts.map((part) => (
                        <Bar
                            key={part.key}
                            dataKey={part.key}
                            stackId="premium"
                            fill={part.color}
                            radius={part.key === last ? [0, 8, 8, 0] : 0}
                            isAnimationActive={false}
                        >
                            {part.key === last && (
                                <LabelList
                                    dataKey="total"
                                    position="right"
                                    offset={12}
                                    fill="var(--ink)"
                                    fontSize={14}
                                    fontWeight={600}
                                    formatter={(value) =>
                                        t("recommendInsurance.premiumValue", {
                                            amount: value.toLocaleString("ko-KR"),
                                        })
                                    }
                                />
                            )}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </figure>
    );
}
