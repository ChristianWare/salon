import LayoutWrapper from '@/components/shared/LayoutWrapper'
import styles from './HowItWorks.module.css'

export default function HowItWorks() {
  return (
    <section className={styles.container}>
        <LayoutWrapper>
            <div className={styles.container}>
                <h2>How it works</h2>
            </div>
        </LayoutWrapper>
    </section>
  )
}