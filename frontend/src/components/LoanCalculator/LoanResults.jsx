// 계산 결과를 시각화하는 그래프 요소 사용
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
// 두 계산기가 공유하는 계산 함수와 표시 정보 사용
import {
    formatWon,
    repaymentMethods,
} from "../../utils/loanCalculator.js";

// 그래프 표시용 숫자와 원 단위 금액을 구분
function MonthlyTooltip({ active, payload }) {
    // 마우스로 가리킨 회차의 원 단위 원본 데이터 사용
    const row = payload?.[0]?.payload;

    // 가리킨 데이터가 없으면 툴팁 숨김
    if (!active || !row) {
        return null;
    }

    return (
        <div className="loan-chart-tooltip">
            <strong>{row.month}회차</strong>
            <p>납입 원금: {formatWon(row.principal)}</p>
            <p>이자: {formatWon(row.interest)}</p>
            <p>납입액: {formatWon(row.payment)}</p>
        </div>
    );
}

// 두 계산기에서 같은 결과 요약과 상환 방식 선택 사용
export function LoanResults({
    results,
    activeMethod,
    onMethodChange,
}) {
    // 계산 전에는 결과 영역을 만들지 않음
    if (!results) {
        return null;
    }

    // 선택한 방식의 계산 결과 사용
    const selectedResult = results[activeMethod];
    // 선택한 방식의 이름과 설명 찾기
    const selectedMethod = repaymentMethods.find(
        (method) => method.value === activeMethod,
    );

    return (
        <div className="loan-result-area">
            {/* 선택한 상환 방식만 강조하는 결과 선택 버튼 영역 */}
            <div
                className="loan-method-tabs"
                role="group"
                aria-label="결과 상환 방식"
            >
                {/* 상환 방식 목록으로 선택 버튼 생성 */}
                {repaymentMethods.map((method) => (
                    <button
                        key={method.value}
                        type="button"
                        className={
                            activeMethod === method.value
                                ? "is-active"
                                : ""
                        }
                        aria-pressed={activeMethod === method.value}
                        onClick={() => onMethodChange(method.value)}
                    >
                        {method.label}
                    </button>
                ))}
            </div>

            {/* 선택한 상환 방식의 계산 기준 안내 */}
            <p className="loan-method-description">
                {selectedMethod.description}
            </p>

            {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
            <p className="form-help">
                총 {selectedResult.totalMonths}개월
                {" · "}거치 {selectedResult.graceMonths}개월
                {" + "}상환 {selectedResult.repaymentMonths}개월
            </p>

            {/* 총상환액·총이자·첫 회차 납입액 표시 */}
            <dl className="loan-summary">
                <div>
                    <dt>총 상환 금액</dt>
                    <dd>{formatWon(selectedResult.totalPayment)}</dd>
                </div>

                <div>
                    <dt>총 이자 금액</dt>
                    <dd>{formatWon(selectedResult.totalInterest)}</dd>
                </div>

                <div>
                    <dt>첫 달 상환 금액</dt>
                    <dd>{formatWon(selectedResult.firstPayment)}</dd>
                </div>
            </dl>

            {/* 이자 계산 기준과 제외한 조건 안내 */}
            <p className="loan-calculation-note">
                연 금리÷12, 월말 납부 기준입니다.
                이자는 원 미만 버림하며 수수료는 제외합니다.
                거치 회차의 납입 원금은 0원입니다.
            </p>
        </div>
    );
}

// 두 계산기에서 선택한 상환 방식의 월별 그래프를 함께 사용
export function LoanChart({
    results,
    activeMethod,
    chartId,
}) {
    // 계산 전에는 결과 영역을 만들지 않음
    if (!results) {
        return null;
    }

    // 현재 선택하거나 반복 중인 방식의 계산 결과 사용
    const result = results[activeMethod];
    // 선택한 방식의 표시 정보 찾기
    const method = repaymentMethods.find(
        (item) => item.value === activeMethod,
    );

    // 그래프 좌표만 만원 단위로 변환하고 정확한 금액은 유지
    const data = result.schedule.map((row) => ({
        ...row,
        // 그래프용 원금을 만원 단위 숫자로 변환
        principalChart: Number(row.principal) / 10000,
        // 그래프용 이자를 만원 단위 숫자로 변환
        interestChart: Number(row.interest) / 10000,
        // 그래프용 납입액을 만원 단위 숫자로 변환
        paymentChart: Number(row.payment) / 10000,
    }));

    return (
        <section
            className="loan-chart-panel"
            aria-labelledby={chartId}
        >
            {/* 결과 또는 서비스 영역 제목 표시 */}
            <h2 id={chartId}>
                {method.label} 월별 상환 그래프
            </h2>

            {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
            <p className="form-help">
                단위: 만원 · 그래프에 마우스를 올리면
                정확한 금액을 확인할 수 있습니다.
            </p>

            {/* 정해진 높이 안에서 부모 너비에 맞춰 그래프 표시 */}
            <div className="loan-chart">
                {/* 부모 영역 크기에 맞춰 그래프 너비와 높이 계산 */}
                <ResponsiveContainer width="100%" height="100%">
                    {/* 월별 회차 데이터를 선 그래프로 표시 */}
                    <LineChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 16,
                            bottom: 8,
                            left: 0,
                        }}
                    >
                        {/* 회차를 가로축에 표시하고 눈금선은 숨김 */}
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
                            tickFormatter={(value) => `${value}회`}
                        />

                        {/* 만원 단위의 표시 좌표를 세로축에 표시 */}
                        <YAxis
                            width={72}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
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

                        {/* 가리킨 회차의 정확한 원 단위 금액 표시 */}
                        <Tooltip
                            content={<MonthlyTooltip />}
                            cursor={{
                                stroke: "#d4eae2",
                                strokeWidth: 1,
                            }}
                        />

                        {/* 해당 데이터를 애니메이션 없이 선으로 표시 */}
                        <Line
                            type="linear"
                            dataKey="principalChart"
                            name="납입 원금"
                            stroke="#78ccb7"
                            strokeWidth={2}
                            dot={data.length === 1 ? { r: 3 } : false}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />

                        {/* 해당 데이터를 애니메이션 없이 선으로 표시 */}
                        <Line
                            type="linear"
                            dataKey="interestChart"
                            name="이자"
                            stroke="#52756a"
                            strokeWidth={2}
                            dot={data.length === 1 ? { r: 3 } : false}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />

                        {/* 해당 데이터를 애니메이션 없이 선으로 표시 */}
                        <Line
                            type="linear"
                            dataKey="paymentChart"
                            name="납입액"
                            stroke="#226857"
                            strokeWidth={2.5}
                            dot={data.length === 1 ? { r: 3 } : false}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

// 선택한 상환 방식의 월별 내역을 별도 영역에 표시
export function LoanSchedule({
    results,
    activeMethod,
    scheduleId,
}) {
    // 계산 전에는 결과 영역을 만들지 않음
    if (!results) {
        return null;
    }

    // 선택한 방식의 계산 결과 사용
    const selectedResult = results[activeMethod];
    // 선택한 방식의 이름과 설명 찾기
    const selectedMethod = repaymentMethods.find(
        (method) => method.value === activeMethod,
    );

    return (
        <section
            className="loan-schedule-panel"
            aria-labelledby={`${scheduleId}-title`}
        >
            {/* 결과 또는 서비스 영역 제목 표시 */}
            <h2 id={`${scheduleId}-title`}>
                월별 상환 스케줄
            </h2>

            {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
            <p className="form-help">
                {selectedMethod.label}
                {" · "}총 {selectedResult.totalMonths}회
            </p>

            <div
                className="loan-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={`${selectedMethod.label} 월별 상환 스케줄 표`}
            >
                {/* 계산 함수가 반환한 회차별 값을 표로 표시 */}
                <table className="loan-schedule-table">
                    {/* 회차별 표의 열 제목 표시 */}
                    <thead>
                        <tr>
                            <th scope="col">회차</th>
                            <th scope="col">납입 원금</th>
                            <th scope="col">이자</th>
                            <th scope="col">납입 원금 합계</th>
                            <th scope="col">잔금</th>
                        </tr>
                    </thead>

                    {/* 계산한 모든 회차를 같은 행 구조로 표시 */}
                    <tbody>
                        {/* 계산 스케줄을 회차 순서대로 표시 */}
                        {selectedResult.schedule.map((row) => (
                            <tr key={row.month}>
                                <th scope="row">{row.month}</th>
                                <td>{formatWon(row.principal)}</td>
                                <td>{formatWon(row.interest)}</td>
                                <td>
                                    {formatWon(row.cumulativePrincipal)}
                                </td>
                                <td>{formatWon(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}