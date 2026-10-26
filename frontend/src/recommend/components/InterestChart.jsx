import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { estimateInterest } from "../utils/interest.js";
import styles from "../recommend.module.css";

const CHART_COUNT = 5;
const ROW_HEIGHT = 44;

export default function InterestChart({ items, purpose, term }) {
    const { t } = useTranslation();
    const data = items
        .slice(0, CHART_COUNT)
        .map((item) => ({
            name: item.company,
            interest: estimateInterest(purpose, item.base_rate, item.rate_type, term),
        }))
        .sort((a, b) => b.interest - a.interest);

    if (data.length === 0) return null;

    const top = Math.max(...data.map((row) => row.interest));

    return (
        <figure className={styles.chart}>
            <figcaption>
                <strong>{t("recommendAccount.chartTitle")}</strong>
                <span className="text-muted">
                    {purpose === "예금"
                        ? t("recommendAccount.chartDeposit", { term })
                        : t("recommendAccount.chartSaving", { term })}
                </span>
            </figcaption>
            <ResponsiveContainer width="100%" height={data.length * ROW_HEIGHT}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 110, bottom: 0, left: 0 }}
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
                        dataKey="interest"
                        radius={[0, 8, 8, 0]}
                        background={{ fill: "var(--mint-soft)", radius: 8 }}
                        isAnimationActive={false}
                    >
                        {data.map((row) => (
                            <Cell
                                key={row.name}
                                fill={row.interest === top ? "var(--primary)" : "var(--brand)"}
                            />
                        ))}
                        <LabelList
                            dataKey="interest"
                            position="right"
                            offset={12}
                            fill="var(--ink)"
                            fontSize={14}
                            fontWeight={600}
                            formatter={(value) =>
                                t("recommendAccount.interestValue", {
                                    amount: value.toLocaleString("ko-KR"),
                                })
                            }
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </figure>
    );
}
