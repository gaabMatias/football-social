interface TeamChipProps {
  name: string;
}

export function TeamChip({ name }: TeamChipProps) {
  return <span className="team-chip">{name}</span>;
}
