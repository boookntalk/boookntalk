type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'

type VisibilityStepProps = {
  value: Visibility
  onChange: (value: Visibility) => void
}

export default function VisibilityStep({
  value,
  onChange,
}: VisibilityStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        기록 공개 범위
      </h2>

      <p className="text-sm text-gray-500">
        이 기록을 누구에게 보여줄지 선택하세요.
      </p>

      <div className="space-y-3">
        <Option
          label="전체 공개"
          description="광장에서 누구나 볼 수 있습니다"
          selected={value === 'PUBLIC'}
          onClick={() => onChange('PUBLIC')}
        />

        <Option
          label="팔로워만"
          description="나를 팔로우한 사람만 볼 수 있습니다"
          selected={value === 'FOLLOWERS'}
          onClick={() => onChange('FOLLOWERS')}
        />

        <Option
          label="나만 보기"
          description="개인 기록으로만 저장됩니다"
          selected={value === 'PRIVATE'}
          onClick={() => onChange('PRIVATE')}
        />
      </div>
    </div>
  )
}

type OptionProps = {
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

function Option({
  label,
  description,
  selected,
  onClick,
}: OptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </button>
  )
}
