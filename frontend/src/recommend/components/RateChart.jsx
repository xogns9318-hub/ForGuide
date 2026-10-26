import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import styles from "../recommend.module.css";

const CHART_COUNT = 5;
const ROW_HEIGHT = 44;

export default function RateChart({ items }) {
    const { t } = useTranslation();
    const data = items
        .filter((item) => item.rate_avg != null)
        .slice(0, CHART_COUNT)
        .map((item) => ({ name: item.company, rate: item.rate_avg }))
        .sort((a, b) => a.rate - b.rate);

    if (data.length === 0) return null;

    const top = Math.max(...data.map((row) => row.rate));
    const lowest = Math.min(...data.map((row) => row.rate));

    return (
        <figure className={styles.chart}>
            <figcaption>
                <strong>{t("recommendLoan.chartTitle")}</strong>
                <span className="text-muted">{t("recommendLoan.chartBasis")}</span>
            </figcaption>
            <ResponsiveContainer width="100%" height={data.length * ROW_HEIGHT}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 90, bottom: 0, left: 0 }}
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
                    <Bar
                        dataKey="rate"
                        radius={[0, 8, 8, 0]}
                        background={{ fill: "var(--mint-soft)", radius: 8 }}
                        isAnimationActive={false}
                    >
                        {data.map((row) => (
                            <Cell
                                key={row.name}
                                fill={row.rate === lowest ? "var(--primary)" : "var(--brand)"}
                            />
                        ))}
                        <LabelList
                            dataKey="rate"
                            position="right"
                            offset={12}
                            fill="var(--ink)"
                            fontSize={14}
                            fontWeight={600}
                            formatter={(value) => t("recommendLoan.rateValue", { rate: value })}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </figure>
    );
}
