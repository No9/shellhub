<template>
  <div
    class="d-flex flex-column justify-space-between align-center flex-sm-row mb-2"
    data-test="sessions-title"
  >
    <h1>Sessions</h1>
  </div>
  <div>
    <SessionList v-if="hasSession" data-test="sessions-list" />

    <BoxMessage
      v-if="showBoxMessage"
      typeMessage="session"
      data-test="BoxMessageSession-component"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import BoxMessage from "../components/Box/BoxMessage.vue";
import { useStore } from "../store";
import SessionList from "../components/Sessions/SessionList.vue";
import handleError from "@/utils/handleError";
import useSnackbar from "@/helpers/snackbar";

const store = useStore();
const snackbar = useSnackbar();
const show = ref(false);

onMounted(async () => {
  try {
    store.dispatch("box/setStatus", true);
    store.dispatch("sessions/resetPagePerpage");

    await store.dispatch("sessions/refresh");
    show.value = true;
  } catch (error: unknown) {
    snackbar.showError("Failed to load the sessions list.");
    handleError(error);
  }
});

const hasSession = computed(
  () => store.getters["sessions/getNumberSessions"] > 0,
);
const showBoxMessage = computed(() => !hasSession.value && show.value);
</script>
