import { Head, usePage } from '@inertiajs/react';
import SiteHeader from '@/components/site-header';
import { configureMoneyFormat } from '@/lib/format-money';

export default function PublicLayout({ title, description, children }) {
    const { props } = usePage();

    if (props.settings) {
        configureMoneyFormat(props.settings);
    }

    return (
        <>
            <Head title={title}>
                {description ? (
                    <meta
                        head-key="description"
                        name="description"
                        content={description}
                    />
                ) : null}
            </Head>
            <div className="relative min-h-screen bg-paper text-ink">
                <SiteHeader />
                <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </>
    );
}
