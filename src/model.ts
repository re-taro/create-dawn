type ColorFunc = (str: string | number) => string

interface FrameworkVariant {
  name: string
  display: string
  color: ColorFunc
}

export interface Framework {
  name: string
  display: string
  color: ColorFunc
  variants: ReadonlyArray<FrameworkVariant>
}
