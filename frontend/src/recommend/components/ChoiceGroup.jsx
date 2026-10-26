import styles from "../recommend.module.css";

export default function ChoiceGroup({ name, legend, value, options, onChange, help }) {
    return (
        <fieldset className={styles.group} aria-describedby={help ? `${name}-help` : undefined}>
            <legend>{legend}</legend>
            <div className={styles.choices}>
                {options.map((option) => (
                    <label key={option.value} className={styles.choice}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
            {help && (
                <p id={`${name}-help`} className={`form-help ${styles.help}`}>
                    {help}
                </p>
            )}
        </fieldset>
    );
}
