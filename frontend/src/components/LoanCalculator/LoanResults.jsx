import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import {
    formatWon,
    repaymentMethods,
    getRepaymentDescription,
} from "../../utils/loanCalculator.js";

// 막대에 해당하는 항목 이름과 정확한 원 단위 금액을 표시한다.
function PaymentTooltip({ active, payload }) {
    // 현재 가리킨 막대의 원본 데이터를 가져온다.
    const row = payload?.[0]?.payload;

    // 가리킨 항목이 없으면 툴팁을 표시하지 않는다.
    if (!active || !row) return null;

    return (
        <div className="loan-chart-tooltip">
            <strong>{row.label}</strong>

            {/* 그래프 좌표로 변환하기 전의 원본 금액을 사용한다. */}
            <p>{formatWon(row.amount)}</p>
        </div>
    );
}

// 계산기 종류에 맞는 결과 항목 표시
export function LoanResults({ mode = "monthly", result }) {
    // 계산 전에는 오른쪽 결과 영역을 비워 둠
    if (!result) return null;

    const method = repaymentMethods.find((item) => item.value === result.method);

    // 월 상환액은 첫 회차·평균·최대·총액 순서
    const monthlyItems = [
        ["첫 회차 상환 금액", result.firstPayment],
        ["평균 상환 금액", result.averagePayment],
        ["최대 상환 금액", result.maximumPayment],
        ["총 상환 금액", result.totalPayment],
    ];

    // 총 이자는 원금균등만 첫 달로 표시
    // 만기일시의 매월 금액은 원금을 제외한 월 이자
    const interestItems = [
        [
            result.method === "equalPrincipal" ? "첫 달 상환 금액" : "매월 상환 금액",
            result.regularPayment,
        ],
        ["총 상환 금액", result.totalPayment],
        ["총 이자 금액", result.totalInterest],
    ];

    const items = mode === "interest" ? interestItems : monthlyItems;

    return (
        <div className="loan-result-area" aria-live="polite">
            {/* 상환 방식 이름은 위쪽에 고정한다. */}
            <h3 className="loan-method-heading">{method.label}</h3>

            {/* 설명과 금액을 한 묶음으로 아래쪽에 여유 있게 배치한다. */}
            <div className="loan-result-details">
                <p className="loan-method-description">{getRepaymentDescription(result)}</p>

                {/* 기존 계산 금액과 표시 순서는 유지한다. */}
                <dl className="loan-summary">
                    {items.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{formatWon(value)}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

export function LoanChart({
    mode = "monthly",
    result,
    chartId,
    animationBegin = 0,
    screenReady = false,
}) {
    // 막대 상승이 끝났는지 확인하며, 재계산 시 새 그래프에서 초기화된다.
    const [barReady, setBarReady] = useState(false);
    // 완료 상태가 바뀌어도 같은 함수를 전달하여 애니메이션 재시작을 막는다.
    const handleBarStart = useCallback(() => {
        setBarReady(false);
    }, []);

    const handleBarEnd = useCallback(() => {
        setBarReady(true);
    }, []);

    // 축 표시 함수도 유지하여 준비 상태 변경 시 축을 다시 설정하지 않는다.
    const renderXAxisTick = useCallback(
        ({ x, y, payload }) => (
            <Text
                x={x}
                y={y + 12}
                width={76}
                textAnchor="middle"
                verticalAnchor="start"
                fill="var(--muted)"
                fontSize={11}
            >
                {payload.value}
            </Text>
        ),
        [],
    );

    const formatYAxisTick = useCallback(
        (value) =>
            Number(value).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
            }),
        [],
    );
    // 스케줄 펼침과 막대 상승이 모두 끝나야 툴팁을 허용한다.
    const tooltipReady = screenReady && barReady;
    // 그래프 문구는 번역 항목을 통해 표시한다.
    const { t } = useTranslation("translation", {
        keyPrefix: "loanChart",
    });

    // 계산 결과나 언어가 바뀔 때만 그래프 데이터를 새로 만든다.
    // 툴팁 준비 상태가 바뀌어도 막대 애니메이션을 다시 시작하지 않는다.
    const data = useMemo(() => {
        if (!result) return [];

        // 결과창에서 사용하는 금액과 항목 순서를 그대로 유지한다.
        const items =
            mode === "interest"
                ? [
                      [
                          result.method === "equalPrincipal"
                              ? "firstMonthPayment"
                              : "regularPayment",
                          result.regularPayment,
                      ],
                      ["totalPayment", result.totalPayment],
                      ["totalInterest", result.totalInterest],
                  ]
                : [
                      ["firstPayment", result.firstPayment],
                      ["averagePayment", result.averagePayment],
                      ["maximumPayment", result.maximumPayment],
                      ["totalPayment", result.totalPayment],
                  ];

        // 막대 높이만 만원으로 변환하고 툴팁의 원 단위 금액은 보존한다.
        return items.map(([key, amount]) => ({
            key,
            label: t(`items.${key}`),
            amount,
            chartValue: Number(amount) / 10000,
        }));
    }, [mode, result, t]);

    // 모든 Hook을 실행한 다음 빈 결과 여부를 확인한다.
    if (!result) return null;

    const method = repaymentMethods.find((item) => item.value === result.method);

    return (
        <section className="loan-chart-panel" aria-labelledby={chartId}>
            <h3 id={chartId}>{t("title", { method: method.label })}</h3>
            {/* 기존 그래프 영역의 크기와 배치를 사용한다. */}
            <div className="loan-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 16,
                            bottom: 8,
                            left: 0,
                        }}
                    >
                        {/* 가로축에 모든 결과 항목을 표시한다. */}
                        {/* 긴 항목 이름은 정해진 너비 안에서 줄바꿈한다. */}
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            // 아래 항목 이름과 막대 영역 사이에 초록색 가로축선을 표시한다.
                            axisLine={{
                                stroke: "var(--primary)",
                                strokeWidth: 1.5,
                            }}
                            interval={0}
                            height={60}
                            tick={renderXAxisTick}
                        />

                        {/* 세로축은 0부터 시작하는 만원 단위 금액이다. */}
                        <YAxis
                            width={72}
                            tickLine={false}
                            // 왼쪽 숫자와 막대 영역 사이에 초록색 세로축선을 표시한다.
                            axisLine={{
                                stroke: "var(--primary)",
                                strokeWidth: 1.5,
                            }}
                            tickMargin={10}
                            domain={[0, "auto"]}
                            tick={{
                                fill: "var(--muted)",
                                fontSize: 12,
                            }}
                            tickFormatter={formatYAxisTick}
                        />

                        {/* 화면 등장과 막대 상승이 끝나기 전에는 툴팁을 숨긴다. */}
                        <Tooltip
                            active={tooltipReady ? undefined : false}
                            content={<PaymentTooltip />}
                            cursor={false}
                        />

                        {/* 막대는 0에서 목표 금액까지 아래에서 위로 올라온다. */}
                        {/* 0.9초 동안 움직이고 끝으로 갈수록 천천히 멈춘다. */}
                        <Bar
                            dataKey="chartValue"
                            name={t("amount")}
                            fill="var(--primary)"
                            // 비활성화된 계산하기 버튼과 같은 농도로 표시
                            fillOpacity={0.5}
                            maxBarSize={56}
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={true}
                            animationBegin={animationBegin}
                            animationDuration={900}
                            animationEasing="ease-out"
                            // 같은 함수를 유지하여 완료 상태가 정상적으로 유지되게 한다.
                            onAnimationStart={handleBarStart}
                            onAnimationEnd={handleBarEnd}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

// 같은 계산 결과에서 계산기 종류별로 필요한 열만 선택
export function LoanSchedule({ mode = "monthly", result, scheduleId }) {
    if (!result) return null;
    const method = repaymentMethods.find((item) => item.value === result.method);
    // 총 이자 표는 4열, 월 상환액 표는 6열
    const columns =
        mode === "interest"
            ? [
                  ["month", "회차"],
                  ["principal", "원금"],
                  ["interest", "이자"],
                  ["payment", "총 금액"],
              ]
            : [
                  ["month", "회차"],
                  ["payment", "상환금"],
                  ["principal", "납입 원금"],
                  ["interest", "이자"],
                  ["cumulativePrincipal", "납입 원금 합계"],
                  ["balance", "잔금"],
              ];

    return (
        <section className="loan-schedule-panel" aria-labelledby={scheduleId + "-title"}>
            <h3 id={scheduleId + "-title"}>월별 상환 스케줄</h3>

            <p className="form-help">
                {method.label} · 총 {result.totalMonths}회
            </p>

            {/* 긴 금액은 자르지 않고 기존 스크롤 영역에서 확인 */}
            <div
                className="loan-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={method.label + " 월별 상환 스케줄 표"}
            >
                <table
                    className={
                        "loan-schedule-table " +
                        (mode === "interest" ? "loan-table-interest" : "loan-table-monthly")
                    }
                >
                    {/* 모드별로 지정한 순서 그대로 열 제목 표시 */}
                    <thead>
                        <tr>
                            {columns.map(([key, label]) => (
                                <th key={key} scope="col">
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* 회차는 행 제목, 나머지는 계산한 금액 그대로 표시 */}
                    <tbody>
                        {result.schedule.map((row) => (
                            <tr key={row.month}>
                                {columns.map(([key]) =>
                                    key === "month" ? (
                                        <th key={key} scope="row">
                                            {row.month}
                                        </th>
                                    ) : (
                                        <td key={key}>{formatWon(row[key])}</td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
