import SelectBox from "../../components/SelectBox/SelectBox.jsx";

export default function AdminFilter({ className, id, label, value, options, onChange }) {
    const labelId = id + "-label";

    return (
        <div className={className}>
            <label id={labelId} htmlFor={id}>{label}</label>
            <SelectBox
                id={id}
                labelledBy={labelId}
                value={value}
                options={options.map(([optionValue, optionLabel]) => ({
                    value: optionValue,
                    label: optionLabel,
                }))}
                onChange={onChange}
            />
        </div>
    );
}
