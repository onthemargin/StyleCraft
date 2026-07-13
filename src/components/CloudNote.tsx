// Honest transparency, not a privacy claim: both models are cloud.
export function CloudNote() {
  return (
    <p className="text-[12px] leading-relaxed text-muted">
      Your text is sent to the cloud — a small model rewrites it and a larger one
      scores it. Nothing is stored after your session.
    </p>
  );
}
