<template>
  <div>
    <DataTable
      :headers="headers"
      :items="devices"
      :itemsPerPage="itemsPerPage"
      :nextPage="next"
      :previousPage="prev"
      :loading="loading"
      :totalCount="numberDevices"
      :actualPage="page"
      :comboboxOptions="[10, 20, 50, 100]"
      @changeItemsPerPage="changeItemsPerPage"
      @clickNextPage="next"
      @clickPreviousPage="prev"
      @clickSortableIcon="sortByItem"
      data-test="devices-list"
    >
      <template v-slot:rows>
        <tr v-for="(item, i) in devices" :key="i">
          <td>
            <v-icon v-if="item.online" color="success" data-test="sucess-icon">
              mdi-check-circle
            </v-icon>
            <v-icon v-else color="#E53935" data-test="error-icon"> mdi-close-circle </v-icon>
          </td>
          <td>{{ item.name }}</td>
          <td class="d-flex align-center">
            <DeviceIcon :icon="item.info.id" class="mr-2" />
            {{ item.info.pretty_name }}
          </td>
          <td>
            <span
              @click="goToNamespace(item.tenant_id)"
              @keypress.enter="goToNamespace(item.tenant_id)"
              tabindex="0"
              class="hover"
            >
              {{ item.namespace }}
            </span>
          </td>
          <td>
            <div v-if="item.tags[0]">
              <v-tooltip
                v-for="(tag, index) in item.tags"
                :key="index"
                bottom
                :disabled="!showTag(tag)"
              >
                <template #activator="{ props }">
                  <v-chip size="small" v-bind="props">
                    {{ displayOnlyTenCharacters(tag) }}
                  </v-chip>
                </template>

                <span v-if="showTag(tag)">
                  {{ tag }}
                </span>
              </v-tooltip>
            </div>
          </td>
          <td>
            {{ formatFullDateTime(item.last_seen) }}
          </td>
          <td>
            <v-chip size="small">
              {{ item.status }}
            </v-chip>
          </td>
          <td>
            <v-tooltip bottom anchor="bottom">
              <template v-slot:activator="{ props }">
                <v-icon
                  tag="a"
                  dark
                  v-bind="props"
                  @click="redirectToDevice(item.uid)"
                  @keypress.enter="redirectToDevice(item.uid)"
                  tabindex="0"
                >mdi-information
                </v-icon>
              </template>
              <span>Info</span>
            </v-tooltip>
          </td>
        </tr>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import useDevicesStore from "@admin/store/modules/devices";
import useSnackbar from "@/helpers/snackbar";
import DataTable from "../DataTable.vue";
import DeviceIcon from "./DeviceIcon.vue";
import { formatFullDateTime } from "../../hooks/date";
import displayOnlyTenCharacters from "../../hooks/string";
import showTag from "../../hooks/tag";

const router = useRouter();
const snackbar = useSnackbar();
const devicesStore = useDevicesStore();

const loading = ref(false);
const filter = ref("");
const itemsPerPage = ref(10);
const page = ref(1);

const headers = ref([
  {
    text: "Online",
    value: "online",
    sortable: true,
  },
  {
    text: "Hostname",
    value: "name",
    sortable: true,
  },
  {
    text: "Info",
    value: "info",
    sortable: true,
  },
  {
    text: "Namespace",
    value: "namespace",
    sortable: true,
  },
  {
    text: "Tags",
    value: "tags",
  },
  {
    text: "Last Seen",
    value: "last_seen",
    sortable: true,
    align: "center",
  },
  {
    text: "Status",
    value: "status",
    sortable: true,
  },
  {
    text: "Actions",
    value: "actions",
  },
]);

const devices = computed(() => devicesStore.list);
const numberDevices = computed(() => devicesStore.getNumberDevices);

onMounted(async () => {
  try {
    loading.value = true;
    await devicesStore.fetch({
      perPage: itemsPerPage.value,
      page: 1,
      filter: "",
      sortStatusField: "",
      sortStatusString: undefined,
    });
  } catch {
    snackbar.showError("Failed to fetch devices.");
  } finally {
    loading.value = false;
  }
});

const getDevices = async (perPageValue: number, pageValue: number) => {
  try {
    loading.value = true;

    const hasDevices = await devicesStore.fetch({
      perPage: perPageValue,
      page: pageValue,
      filter: filter.value,
      sortStatusField: devicesStore.getSortStatusField,
      sortStatusString: devicesStore.getSortStatusString,
    });

    if (!hasDevices) {
      page.value--;
    }

    loading.value = false;
  } catch (error) {
    snackbar.showError("Failed to fetch devices.");
  }
};

const sortByItem = async (field: string) => {
  let sortStatusString = devicesStore.getSortStatusString;
  if (sortStatusString === undefined) {
    sortStatusString = "asc";
  } else if (sortStatusString === "asc") {
    sortStatusString = "desc";
  } else {
    sortStatusString = undefined;
  }
  devicesStore.setSortStatus({
    sortStatusField: field,
    sortStatusString,
  });
  await getDevices(itemsPerPage.value, page.value);
};

const next = async () => {
  await getDevices(itemsPerPage.value, ++page.value);
};

const prev = async () => {
  if (page.value > 1) await getDevices(itemsPerPage.value, --page.value);
};

const changeItemsPerPage = async (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
};

watch(itemsPerPage, async () => {
  await getDevices(itemsPerPage.value, page.value);
});

const goToNamespace = (namespace: string) => {
  router.push({ name: "namespaceDetails", params: { id: namespace } });
};

const redirectToDevice = (deviceId: string) => {
  router.push({ name: "deviceDetails", params: { id: deviceId } });
};

defineExpose({ headers, devices, loading, itemsPerPage });
</script>

<style scoped>
.hover:hover,
.hover:focus {
  cursor: pointer;
  text-decoration: underline;
}
</style>
