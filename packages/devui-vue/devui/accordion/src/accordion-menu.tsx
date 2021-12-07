import { computed, defineComponent, toRefs, Fragment, inject, ref } from 'vue'
import {
  AccordionItemClickEvent,
  AccordionMenuItem,
  AccordionMenuToggleEvent
} from './accordion.type'
import DAccordionList from './accordion-list'
import { accordionProps } from './accordion-types'
import OpenIcon from './accordion-open-icon'
import { getRootSlots } from '../src/utils'

export default defineComponent({
  name: 'DAccordionMenu',
  components: {
    OpenIcon
  },
  props: {
    item: Object as () => AccordionMenuItem,
    deepth: {
      type: Number,
      default: 0
    },
    parent: {
      type: Object as () => AccordionMenuItem,
      default: null
    },
    ...accordionProps
  },
  setup(props, { slots }) {
    const {
      item,
      deepth,
      parent,
      openKey,
      menuItemTemplate,
      activeKey,
      autoOpenActiveMenu,
      disabledKey
    } = toRefs(props)

    const rootSlots = getRootSlots()
    const accordionCtx = inject('accordionContext') as any

    let parentValue = parent.value
    let deepValue = deepth.value

    const toggle = (itemEvent: AccordionMenuToggleEvent) => {
      if (!itemEvent.open && item.value.children && item.value.children.some((i) => i.active)) {
        itemEvent.item.active = true
      } else {
        itemEvent.item.active = null
      }
      accordionCtx.menuToggleFn(itemEvent)
    }

    const keyOpen = computed(() => {
      return item.value && item.value[openKey.value]
    })
    const disabled = computed(() => {
      return item.value && item.value[disabledKey.value]
    })
    const childActived = computed(() => {
      return item.value.active // TODO:待处理
    })

    const open = computed(() => {
      return keyOpen.value === undefined && autoOpenActiveMenu.value
        ? childActived.value
        : keyOpen.value
    })

    return () => {
      return (
        <>
          <div
            class={[
              'devui-accordion-item-title',
              'devui-over-flow-ellipsis',
              open.value && 'open',
              childActived.value && 'active',
              disabled.value && 'disabled'
            ]}
            title={item.value.title}
            style={{ textIndent: deepValue * 20 + 'px' }}
            onClick={(e) =>
              !disabled.value &&
              toggle({
                item: item.value,
                open: !open.value,
                parent: parentValue,
                event: e
              })
            }
          >
            <div
              class={['devui-accordion-splitter', deepValue === 0 && 'devui-parent-list']}
              style={{ left: deepValue * 20 + 10 + 'px' }}
            ></div>
            {!rootSlots.menuItemTemplate && <>{item.value.title}</>}
            {rootSlots.menuItemTemplate &&
              rootSlots.menuItemTemplate?.({
                parent: parentValue,
                deepth: deepValue,
                item: item.value
              })}
            <span class='devui-accordion-open-icon'>
              <OpenIcon></OpenIcon>
            </span>
          </div>
          <div
            class={[
              !open.value && 'devui-accordion-menu-hidden',
              'devui-accordion-submenu',
              'devui-accordion-show-animate'
            ]}
          >
            <DAccordionList
              deepth={deepValue + 1}
              data={item.value.children || []}
              parent={item.value}
            ></DAccordionList>
          </div>
        </>
      )
    }
  }
})
