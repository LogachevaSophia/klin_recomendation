
import styles from "./ActionNode.module.scss"
import classNames from "classnames"

export const ActionNode: React.FC = ({data}: any) => {
    return (
        <div>
            <div className={classNames(styles.actionNode)}>
                <strong>{data.label}</strong>
            </div>
            

        </div>
    )
        
}