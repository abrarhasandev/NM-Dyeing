import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef(
  ({ id, className, config, children, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-neutral-200 [&_.recharts-cartesian-grid-vertical_line]:stroke-neutral-200 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-neutral-200 [&_.recharts-dot_circle]:fill-white [&_.recharts-active-dot_circle]:stroke-white [&_.recharts-legend-item]:text-neutral-500 [&_.recharts-legend-item_svg]:mr-1.5 [&_.recharts-legend-item_svg]:h-3 [&_.recharts-legend-item_svg]:w-3 [&_.recharts-legend-item_svg]:shrink-0 [&_.recharts-legend-item_svg]:rounded-sm [&_.recharts-responsive-container]:min-h-[220px] [&_.recharts-sector]:stroke-transparent [&_.recharts-surface]:outline-none [&_.recharts-tooltip-cursor]:stroke-neutral-100",
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.color
  )

  if (colorConfig.length === 0) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] {
            ${colorConfig
              .map(([key, item]) => {
                const color = item.color
                return `--color-${key}: ${color};`
              })
              .join("\n")}
          }
        `,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${item.dataKey}`
      const itemConfig = config[key]
      const value =
        typeof label === "string"
          ? config[label]?.label || label
          : item.payload[label] || label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs shadow-md",
          className
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${item.dataKey}`
            const itemConfig = config[key]
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-neutral-500",
                  indicator === "dashed" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name !== undefined ? (
                  <>{formatter(item.value, item.name, item, index, payload)}</>
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[inherit]",
                          indicator === "dot" && "h-2.5 w-2.5",
                          indicator === "line" && "w-0.5",
                          indicator === "dashed" &&
                            "w-0 border-t border-dashed bg-transparent"
                        )}
                        style={{
                          backgroundColor:
                            indicator !== "dashed" ? indicatorColor : undefined,
                          borderColor: indicatorColor,
                        }}
                      />
                    )}
                    <div className="flex flex-1 justify-between leading-none">
                      <div className="grid gap-1.5">
                        <span className="text-neutral-500">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value !== undefined && (
                        <span className="font-mono font-medium tabular-nums text-neutral-900">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef(
  ({ className, align = "left", verticalAlign = "top", payload, iconType }, ref) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${item.dataKey || item.value}`
          const itemConfig = config[key]

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 text-xs text-neutral-500 [&>svg]:h-3 [&>svg]:w-3"
              )}
            >
              <div
                className="h-2 w-2 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
              <span>{itemConfig?.label || item.value}</span>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
