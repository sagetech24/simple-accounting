export default function EmptyPanel({ title, description }) {
    return (
        <div className="flex h-full min-h-[28rem] flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {title}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted">
                {description ?? 'Nothing here yet.'}
            </p>
        </div>
    );
}
