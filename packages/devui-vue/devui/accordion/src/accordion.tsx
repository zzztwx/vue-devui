import {
  computed,
  defineComponent,
  onBeforeUpdate,
  onMounted,
  provide,
  ref,
  SetupContext,
  toRefs,
  watch
} from 'vue'
import AccordionList from './accordion-list'
import { accordionProps, AccordionProps } from './accordion-types'
import {
  AccordionItemClickEvent,
  AccordionMenuItem,
  AccordionMenuToggleEvent
} from './accordion.type'
import './accordion.scss'

export default defineComponent({
  name: 'DAccordion',
  props: accordionProps,
  setup(props: AccordionProps, { emit, slots }) {
    const {
      data,
      childrenKey,
      activeKey,
      openKey,
      accordionType,
      autoOpenActiveMenu,
      restrictOneOpen,
      loadingTemplate
    } = toRefs(props)

    let clickActiveItem: AccordionMenuItem | undefined = undefined //记录用户点击的激活菜单项

    const flatten = (
      arr: Array<any>,
      childrenKey = 'children',
      includeParent = false,
      includeLeaf = true
    ) => {
      return arr.reduce((acc, cur) => {
        const children = cur[childrenKey]
        if (children === undefined) {
          if (includeLeaf) {
            acc.push(cur)
          }
        } else {
          if (includeParent) {
            acc.push(cur)
          }
          if (Array.isArray(children)) {
            acc.push(...flatten(children, childrenKey, includeParent))
          }
        }
        return acc
      }, [])
    }

    const initActiveItem = () => {
      const activeItem = flatten(data.value, childrenKey.value)
        .filter((item) => item[activeKey.value])
        .pop()
      if (activeItem) {
        if (!clickActiveItem) {
          activeItemFn(activeItem)
        }
      } else {
        clickActiveItem = undefined
      }
    }

    // 激活子菜单项并去掉其他子菜单的激活
    const activeItemFn = (item) => {
      if (clickActiveItem && clickActiveItem[activeKey.value]) {
        clickActiveItem[activeKey.value] = false
      }
      item[activeKey.value] = true
      clickActiveItem = item
      emit('activeItemChange', clickActiveItem)
    }
    // 打开或关闭一级菜单，如果有限制只能展开一项则关闭其他一级菜单
    const openMenuFn = (item, open) => {
      if (open && restrictOneOpen.value) {
        data.value.forEach((itemtemp) => {
          itemtemp[openKey.value] = false
        })
      }
      item[openKey.value] = open
    }

    // 点击了可点击菜单
    const itemClickFn = (itemEvent: AccordionItemClickEvent) => {
      data.value.forEach((item) => (item[activeKey.value] = null))
      const prevActiveItem = clickActiveItem
      activeItemFn(itemEvent.item)
      emit('itemClick', { ...itemEvent, prevActiveItem: prevActiveItem })
    }

    const linkItemClickFn = (itemEvent: AccordionItemClickEvent) => {
      const prevActiveItem = clickActiveItem
      clickActiveItem = itemEvent.item
      emit('linkItemClick', { ...itemEvent, prevActiveItem: prevActiveItem })
    }

    // 打开或关闭可折叠菜单
    const menuToggleFn = (menuEvent: AccordionMenuToggleEvent) => {
      openMenuFn(menuEvent.item, menuEvent.open)
      emit('menuToggle', menuEvent)
    }

    const cleanOpenData = () => {
      flatten(data.value, childrenKey.value, true, false).forEach(
        (item) => (item[openKey.value] = undefined)
      )
    }

    provide('accordionContext', {
      itemClickFn,
      linkItemClickFn,
      menuToggleFn
    })

    onMounted(() => {
      if (data.value) {
        initActiveItem()
      }
    })

    watch(
      () => autoOpenActiveMenu.value,
      (current, preV) => {
        if (current && preV === false) {
          cleanOpenData()
        }
      }
    )

    return () => {
      return (
        <div
          class={[
            'devui-accordion-menu',
            'devui-scrollbar',
            'devui-accordion-show-animate',
            accordionType.value === 'normal' && 'devui-accordion-menu-normal'
          ]}
        >
          <AccordionList
            data={data.value}
            deepth={0}
            parent={null}
            {...(props as any)}
          ></AccordionList>
        </div>
      )
    }
  }
})
