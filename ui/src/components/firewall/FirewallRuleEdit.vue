<template>
  <div>
    <v-list-item
      @click="showDialog = true"
      v-bind="$attrs"
      :disabled="notHasAuthorization"
      data-test="firewall-edit-rule-btn"
    >
      <div class="d-flex align-center">
        <div class="mr-2">
          <v-icon> mdi-pencil </v-icon>
        </div>

        <v-list-item-title data-test="mdi-information-list-item">
          Edit
        </v-list-item-title>
      </div>
    </v-list-item>

    <v-dialog v-model="showDialog" width="520" transition="dialog-bottom-transition">
      <v-card class="bg-v-theme-surface">
        <v-card-title class="text-h5 pa-3 bg-primary" data-test="firewall-edit-rule-title">
          Edit Firewall Rule
        </v-card-title>
        <form @submit.prevent="edit" class="mt-3">
          <v-card-text>
            <v-row>
              <v-col>
                <v-select
                  v-model="ruleFirewallLocal.status"
                  :items="ruleStatus"
                  item-title="text"
                  item-value="type"
                  label="Rule status"
                  variant="underlined"
                  data-test="firewall-rule-status"
                />
              </v-col>

              <v-col>
                <v-text-field
                  v-model="ruleFirewallLocal.priority"
                  label="Rule priority"
                  type="number"
                  variant="underlined"
                  :rules="[rules.required]"
                  data-test="firewall-rule-priority"
                />
              </v-col>

              <v-col>
                <v-select
                  v-model="ruleFirewallLocal.policy"
                  :items="state"
                  item-title="name"
                  item-value="id"
                  label="Rule policy"
                  variant="underlined"
                  data-test="firewall-rule-policy"
                />
              </v-col>
            </v-row>

            <v-row class="mt-1 mb-1 px-3">
              <v-select
                v-model="choiceIP"
                label="Source IP access restriction"
                :items="sourceIPFieldChoices"
                item-title="filterText"
                item-value="filterName"
                variant="underlined"
                data-test="firewall-rule-source-ip"
              />
            </v-row>

            <v-text-field
              v-if="choiceIP === 'ipDetails'"
              v-model="sourceIp"
              label="Rule source IP"
              variant="underlined"
              :error-messages="sourceIpError"
              data-test="firewall-rule-source-ip-details"
            />

            <v-row class="mt-1 mb-1 px-3">
              <v-select
                v-model="choiceUsername"
                label="Device username access restriction"
                :items="usernameFieldChoices"
                item-title="filterText"
                item-value="filterName"
                variant="underlined"
                data-test="username-field"
              />
            </v-row>

            <v-text-field
              v-if="choiceUsername === 'username'"
              v-model="username"
              label="Username access restriction"
              placeholder="Username used during the connection"
              variant="underlined"
              :error-messages="usernameError"
              data-test="firewall-rule-username-restriction"
            />

            <v-row class="mt-2 mb-1 px-3">
              <v-select
                v-model="choiceFilter"
                label="Device access restriction"
                :items="filterFieldChoices"
                item-title="filterText"
                item-value="filterName"
                variant="underlined"
                data-test="device-field"
              />
            </v-row>

            <v-text-field
              v-if="choiceFilter === 'hostname'"
              v-model="filterField"
              label="Device hostname access restriction"
              placeholder="Device hostname used during the connection"
              :error-messages="filterFieldError"
              variant="underlined"
              data-test="firewall-rule-hostname-restriction"
            />

            <v-row v-if="choiceFilter === 'tags'" class="px-3 mt-2">
              <v-select
                v-model="tagChoices"
                :items="tagNames"
                data-test="tags-selector"
                attach
                chips
                label="Tags"
                :error-messages="errMsg"
                variant="underlined"
                multiple
              />
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              @click="close"
              data-test="firewall-rule-cancel"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              data-test="firewall-rule-save-btn"
            >
              Save
            </v-btn>
          </v-card-actions>
        </form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useField } from "vee-validate";
import { ref, watch, computed } from "vue";
import * as yup from "yup";
import { useStore } from "@/store";
import { FirewallRuleType } from "./FirewallRuleAdd.vue";
import handleError from "@/utils/handleError";
import useSnackbar from "@/helpers/snackbar";

const props = defineProps({
  firewallRule: {
    type: Object as () => FirewallRuleType,
    required: false,
    default: null,
  },
  show: {
    type: Boolean,
    required: false,
  },
  notHasAuthorization: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();
const snackbar = useSnackbar();
const emit = defineEmits(["update"]);
const showDialog = ref(false);
const choiceUsername = ref("all");
const choiceFilter = ref("all");
const choiceIP = ref("all");
const tagChoices = ref<Array<string>>([]);

const sourceIPFieldChoices = ref([
  {
    filterName: "all",
    filterText: "Define source IP to all devices",
  },
  {
    filterName: "ipDetails",
    filterText: "Restrict source IP through a regexp",
  },
]);

const filterFieldChoices = ref([
  {
    filterName: "all",
    filterText: "Define rule to all devices",
  },
  {
    filterName: "hostname",
    filterText: "Restrict rule with a regexp for hostname",
  },
  {
    filterName: "tags",
    filterText: "Restrict rule by device tags",
  },
]);

const usernameFieldChoices = ref([
  {
    filterName: "all",
    filterText: "Define rule to all users",
  },
  {
    filterName: "username",
    filterText: "Restrict access using a regexp for username",
  },
]);

const ruleStatus = ref([
  {
    type: "active",
    text: "Active",
  },
  {
    type: "inactive",
    text: "Inactive",
  },
]);

const state = ref([
  {
    id: "allow",
    name: "allow",
  },
  {
    id: "deny",
    name: "deny",
  },
]);

const ruleFirewallLocal = ref<FirewallRuleType>({
  priority: 0,
  source_ip: ".*",
  filter: {},
  username: ".*",
  status: "",
  policy: "",
});

const {
  value: sourceIp,
  errorMessage: sourceIpError,
  setErrors: setSourceIpError,
} = useField<string | undefined>("sourceIp", yup.string().required(), {
  initialValue: ruleFirewallLocal.value.source_ip,
});

const {
  value: username,
  errorMessage: usernameError,
  setErrors: setUsernameError,
} = useField<string | undefined>("username", yup.string().required(), {
  initialValue: ruleFirewallLocal.value.username,
});

const {
  value: filterField,
  errorMessage: filterFieldError,
  setErrors: setFilterFieldError,
} = useField<string | undefined>("filterField", yup.string().required(), {
  initialValue: "",
});

const rules = ref({
  required: (value: string) => !!value || "Required.",
});

const errMsg = ref("");

const tagNames = computed(() => store.getters["tags/list"]);

watch(choiceFilter, async () => {
  if (choiceFilter.value === "tags") {
    await store.dispatch("tags/fetch");
  }
});

const selectRestriction = () => {
  if (choiceUsername.value === "all") {
    ruleFirewallLocal.value = {
      ...ruleFirewallLocal.value,
      username: ".*",
    };
  } else if (choiceUsername.value === "username") {
    ruleFirewallLocal.value = {
      ...ruleFirewallLocal.value,
      username: username.value,
    };
  }

  let filter;

  if (choiceIP.value === "all") {
    ruleFirewallLocal.value = {
      ...ruleFirewallLocal.value,
      source_ip: ".*",
    };
  } else if (choiceIP.value === "ipDetails") {
    ruleFirewallLocal.value = {
      ...ruleFirewallLocal.value,
      source_ip: sourceIp.value,
    };
  }

  switch (choiceFilter.value) {
    case "all": {
      filter = {
        hostname: ".*",
      };
      break;
    }
    case "hostname": {
      filter = {
        hostname: filterField.value,
      };
      break;
    }
    case "tags": {
      filter = {
        tags: tagChoices.value,
      };
      break;
    }
    default:
  }

  ruleFirewallLocal.value = {
    ...ruleFirewallLocal.value,
    filter,
  };
};

const setLocalVariable = () => {
  let status = "inactive";
  const {
    action,
    active,
    username: usernameLocal,
    filter,
    ...fr
  } = props.firewallRule;

  if (fr.source_ip !== ".*") {
    choiceIP.value = "ipDetails";
    sourceIp.value = fr.source_ip;
  } else {
    choiceIP.value = "all";
    sourceIp.value = ".*";
  }

  if (usernameLocal !== ".*") {
    choiceUsername.value = "username";
    username.value = usernameLocal;
  } else {
    choiceUsername.value = "all";
    username.value = ".*";
  }

  if (filter && !!filter.hostname && filter.hostname !== ".*") {
    choiceFilter.value = "hostname";
    filterField.value = filter.hostname;
  } else if (filter && filter.tags) {
    choiceFilter.value = "tags";
    tagChoices.value = filter.tags;
  }

  if (active) {
    status = "active";
  }

  let filtObj = {};

  if (choiceFilter.value === "hostname") {
    filtObj = { hostname: filterField.value };
  } else if (choiceFilter.value === "tags") {
    filtObj = { tags: tagChoices.value };
  }

  ruleFirewallLocal.value = {
    ...fr,
    username: username.value,
    filter: filtObj,
    status,
    policy: action,
  };
};

watch(sourceIp, () => {
  ruleFirewallLocal.value.source_ip = sourceIp.value;
});

watch(username, () => {
  ruleFirewallLocal.value.username = username.value;
});

watch(showDialog, (val) => {
  if (val) setLocalVariable();
});

const hasErrors = () => {
  if (
    choiceIP.value === "ipDetails"
        && ruleFirewallLocal.value.source_ip === ""
  ) {
    setSourceIpError("This Field is required !");
    return true;
  }

  if (
    choiceUsername.value === "username"
        && ruleFirewallLocal.value.username === ""
  ) {
    setUsernameError("This Field is required !");
    return true;
  }

  if (choiceFilter.value === "hostname" && filterField.value === "") {
    setFilterFieldError("This Field is required !");
    return true;
  }

  if (choiceFilter.value === "tags" && tagChoices.value.length === 0) {
    errMsg.value = "This Field is required !";
    return true;
  }

  return false;
};

const resetChoices = () => {
  choiceIP.value = "all";
  choiceUsername.value = "all";
  choiceFilter.value = "all";
  sourceIp.value = "";
  username.value = "";
  filterField.value = "";
  tagChoices.value = [];
};

const close = () => {
  resetChoices();
  showDialog.value = false;
};

const update = () => {
  emit("update");
  close();
};

const edit = async () => {
  if (!hasErrors()) {
    selectRestriction();
    try {
      await store.dispatch("firewallRules/put", ruleFirewallLocal.value);
      snackbar.showSuccess("Firewall rule updated successfully.");
      update();
    } catch (error: unknown) {
      snackbar.showError("Error while updating firewall rule.");
      handleError(error);
    }
  }
};

defineExpose({ choiceIP, choiceFilter, choiceUsername });
</script>
