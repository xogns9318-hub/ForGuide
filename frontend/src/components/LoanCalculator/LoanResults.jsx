import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    formatWon,
    repaymentMethods,
    getRepaymentDescription,
} from "../../utils/loanCalculator.js";

// 그래프에서 가리킨 회차의 정확한 상환금 표시
function PaymentTooltip({ active, payload }) {
    const row = payload?.[0]?.payload;

    // 가리킨 회차가 없으면 툴팁을 표시하지 않음
    if (!active || !row) return null;

    return (
        <div className="loan-chart-tooltip">
            <strong>{row.month}회차</strong>
            <p>상환금: {formatWon(row.payment)}</p>
        </div>
    );
}

// 계산기 종류에 맞는 결과 항목 표시
export function LoanResults({ mode = "monthly", result }) {
    // 계산 전에는 오른쪽 결과 영역을 비워 둠
    if (!result) return null;

    const method = repaymentMethods.find(
        (item) => item.value === result.method,
    );

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
            result.method === "equalPrincipal"
                ? "첫 달 상환 금액"
                : "매월 상환 금액",
            result.regularPayment,
        ],
        ["총 상환 금액", result.totalPayment],
        ["총 이자 금액", result.totalInterest],
    ];

    const items =
        mode === "interest" ? interestItems : monthlyItems;

    return (
        <div className="loan-result-area" aria-live="polite">
            {/* 결과에서는 방식 선택 버튼 대신 이름만 표시 */}
            <h3 className="loan-method-heading">
                {method.label}
            </h3>

            {/* 실제 거치 여부와 상환 방식에 맞는 설명 */}
            <p className="loan-method-description">
                {getRepaymentDescription(result)}
            </p>

            {/* 모드별 결과를 같은 정렬 규칙으로 표시 */}
            <dl className="loan-summary">
                {items.map(([label, value]) => (
                    <div key={label}>
                        <dt>{label}</dt>
                        <dd>{formatWon(value)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

// 원금과 이자를 합친 실제 월별 상환금만 시각화
export function LoanChart({ result, chartId }) {
    if (!result) return null;

    const method = repaymentMethods.find(
        (item) => item.value === result.method,
    );

    // 그래프 좌표만 만원 단위 숫자로 변환
    // 정확한 원 단위 금액은 표와 툴팁에서 원본 그대로 사용
    const data = result.schedule.map((row) => ({
        ...row,
        paymentChart: Number(row.payment) / 10000,
    }));

    return (
        <section
            className="loan-chart-panel"
            aria-labelledby={chartId}
        >
            <h3 id={chartId}>
                {method.label} 월별 상환금
            </h3>

            {/* 선과 축이 무엇을 의미하는지 바로 안내 */}
            <p className="form-help">
                선은 각 회차에 낼 원금과 이자의 합계입니다.
                가로축은 회차, 세로축은 만원입니다.
            </p>

            {/* 기존 높이를 유지하고 점선 격자와 하단 범례는 사용하지 않음 */}
            <div className="loan-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 16,
                            bottom: 8,
                            left: 0,
                        }}
                    >
                        {/* 가로축에는 회차 표시 */}
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            minTickGap={32}
                            interval="preserveStartEnd"
                            tick={{
                                fill: "#52756a",
                                fontSize: 12,
                            }}
                            tickFormatter={(value) => value + "회"}
                        />

                        {/* 세로축에는 만원 단위 상환금 표시 */}
                        <YAxis
                            width={72}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            domain={[0, "auto"]}
                            tick={{
                                fill: "#52756a",
                                fontSize: 12,
                            }}
                            tickFormatter={(value) =>
                                Number(value).toLocaleString(
                                    "ko-KR",
                                    { maximumFractionDigits: 1 },
                                )
                            }
                        />

                        {/* 마우스를 올리면 정확한 원 단위 금액 확인 */}
                        <Tooltip
                            content={<PaymentTooltip />}
                            cursor={{
                                stroke: "#d4eae2",
                                strokeWidth: 1,
                            }}
                        />

                        {/* 상환금 하나만 표시하여 선의 의미를 명확히 함 */}
                        <Line
                            type="linear"
                            dataKey="paymentChart"
                            name="상환금"
                            stroke="#226857"
                            strokeWidth={2.5}
                            dot={
                                data.length === 1
                                    ? { r: 3 }
                                    : false
                            }
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

// 같은 계산 결과에서 계산기 종류별로 필요한 열만 선택
export function LoanSchedule({
    mode = "monthly",
    result,
    scheduleId,
}) {
    if (!result) return null;

    const method = repaymentMethods.find(
        (item) => item.value === result.method,
    );

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
        <section
            className="loan-schedule-panel"
            aria-labelledby={scheduleId + "-title"}
        >
            <h3 id={scheduleId + "-title"}>
                월별 상환 스케줄
            </h3>

            <p className="form-help">
                {method.label} · 총 {result.totalMonths}회
            </p>

            {/* 긴 금액은 자르지 않고 기존 스크롤 영역에서 확인 */}
            <div
                className="loan-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={
                    method.label + " 월별 상환 스케줄 표"
                }
            >
                <table
                    className={
                        "loan-schedule-table " +
                        (
                            mode === "interest"
                                ? "loan-table-interest"
                                : "loan-table-monthly"
                        )
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
                                        <td key={key}>
                                            {formatWon(row[key])}
                                        </td>
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