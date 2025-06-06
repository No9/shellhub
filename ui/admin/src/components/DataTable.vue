<template>
  <div>
    <v-table>
      <thead>
        <tr>
          <th v-for="(head, i) in headers" :key="i" :class="head.align ? `text-${head.align}` : 'text-left'">
            <span
              v-if="head.sortable"
              @click="$emit('clickSortableIcon', head.value)"
              @keypress.enter="$emit('clickSortableIcon', head.value)"
              tabindex="0"
              class="hover"
            >
              {{ head.text }}
              <v-tooltip activator="parent" anchor="top">Sort by {{ head.text }}</v-tooltip>
            </span>
            <span v-else> {{ head.text }}</span>
          </th>
        </tr>
      </thead>
      <tbody v-if="items.length">
        <slot name="rows" />
      </tbody>
      <div v-else class="pa-4 text-subtitle-2">
        <p>No data available</p>
      </div>
    </v-table>
    <v-divider />
    <v-progress-linear v-if="loading" indeterminate />
    <div class="d-flex w-100 justify-end align-center">
      <span class="text-subtitle-2 mr-4">Items per page:</span>
      <div>
        <v-combobox
          :items="comboboxOptions"
          :model-value="props.itemsPerPage"
          @update:model-value="$emit('changeItemsPerPage', $event)"
          outlined
          variant="underlined"
          hide-details
          class="mb-4"
          no-filter
        />

      </div>
      <div class="d-flex align-center">
        <v-btn icon="mdi-chevron-left" variant="plain" @click="$emit('clickPreviousPage')" :disabled="actualPage <= 1" />
        <span class="text-subtitle-2">{{ actualPage }} of {{ pageQuantity }}</span>
        <v-btn
          icon="mdi-chevron-right"
          variant="plain"
          @click="$emit('clickNextPage')"
          :disabled="pageQuantity <= 1 || actualPage === pageQuantity" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";

type HeaderItem = {
  text: string;
  value: string;
  sortable?: boolean;
  align?: string | undefined;
};

type UserTable = {
  name: string;
  email: string;
  username: string;
  namespaces: string;
};

const props = defineProps({
  headers: {
    type: Array as PropType<HeaderItem[]>,
    default: () => [],
    required: true,
  },
  items: {
    type: Array,
    default: () => [] as PropType<UserTable[]>,
    required: false,
  },
  itemsPerPage: {
    type: Number,
    required: true,
  },
  comboboxOptions: {
    type: Array as PropType<number[]>,
    required: false,
    default: () => [10, 20, 50, 100],
  },
  loading: {
    type: Boolean,
    default: false,
    required: false,
  },
  actualPage: {
    type: Number,
    default: 1,
  },
  totalCount: {
    type: Number,
    required: true,
  },
  nextPage: {
    type: Function as PropType<() => void>,
    default: () => true,
  },
  previousPage: {
    type: Function as PropType<() => void>,
    default: () => true,
  },
});
defineEmits(["changeItemsPerPage", "clickNextPage", "clickPreviousPage", "clickSortableIcon"]);

const pageQuantity = computed(() => Math.ceil(props.totalCount / props.itemsPerPage));
</script>

<style scoped>
.hover:hover {
  cursor: pointer;
  text-decoration: underline;
}
</style>
