import { mount, VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import MockAdapter from "axios-mock-adapter";
import { expect, describe, it, beforeEach, vi } from "vitest";
import { store, key } from "@/store";
import DeviceIcon from "@/components/Devices/DeviceIcon.vue";
import { router } from "@/router";
import { namespacesApi, billingApi, devicesApi } from "@/api/http";
import { SnackbarPlugin } from "@/plugins/snackbar";

const devices = [
  {
    uid: "a582b47a42d",
    name: "39-5e-2a",
    identity: {
      mac: "00:00:00:00:00:00",
    },
    info: {
      id: "linuxmint",
      pretty_name: "Linux Mint 19.3",
      version: "",
    },
    public_key: "----- PUBLIC KEY -----",
    tenant_id: "fake-tenant-data",
    last_seen: "2020-05-20T18:58:53.276Z",
    online: false,
    namespace: "user",
    status: "accepted",
  },
  {
    uid: "a582b47a42e",
    name: "39-5e-2b",
    identity: {
      mac: "00:00:00:00:00:00",
    },
    info: {
      id: "linuxmint",
      pretty_name: "Linux Mint 19.3",
      version: "",
    },
    public_key: "----- PUBLIC KEY -----",
    tenant_id: "fake-tenant-data",
    last_seen: "2020-05-20T19:58:53.276Z",
    online: true,
    namespace: "user",
    status: "accepted",
  },
];

const members = [
  {
    id: "xxxxxxxx",
    username: "test",
    role: "owner",
  },
];

const billingData = {
  active: false,
  status: "canceled",
  customer_id: "cus_test",
  subscription_id: "sub_test",
  current_period_end: 2068385820,
  created_at: "",
  updated_at: "",
  invoices: [],
};

const namespaceData = {
  name: "test",
  owner: "xxxxxxxx",
  tenant_id: "fake-tenant-data",
  members,
  max_devices: 3,
  devices_count: 3,
  devices: 2,
  created_at: "",
  billing: billingData,
};

const authData = {
  status: "",
  token: "",
  user: "test",
  name: "test",
  tenant: "fake-tenant-data",
  email: "test@test.com",
  id: "xxxxxxxx",
  role: "owner",
};

const customerData = {
  id: "cus_test",
  name: "test",
  email: "test@test.com",
  payment_methods: [
    {
      id: "test_id",
      number: "xxxxxxxxxxxx4242",
      brand: "visa",
      exp_month: 3,
      exp_year: 2029,
      cvc: "",
      default: true,
    },
  ],
};

const stats = {
  registered_devices: 3,
  online_devices: 1,
  active_sessions: 0,
  pending_devices: 0,
  rejected_devices: 0,
};

describe("Device Icon", () => {
  let wrapper: VueWrapper<InstanceType<typeof DeviceIcon>>;

  const vuetify = createVuetify();

  let mockNamespace: MockAdapter;
  let mockBilling: MockAdapter;
  let mockDevices: MockAdapter;

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.setItem("tenant", "fake-tenant-data");

    mockBilling = new MockAdapter(billingApi.getAxios());
    mockNamespace = new MockAdapter(namespacesApi.getAxios());
    mockDevices = new MockAdapter(devicesApi.getAxios());

    mockNamespace.onGet("http://localhost:3000/api/namespaces/fake-tenant-data").reply(200, namespaceData);
    mockBilling.onGet("http://localhost:3000/api/billing/customer").reply(200, customerData);
    mockBilling.onGet("http://localhost:3000/api/billing/subscription").reply(200, billingData);
    mockBilling.onGet("http://localhost:3000/api/billing/devices-most-used").reply(200, devices);
    mockDevices.onGet("http://localhost:3000/api/devices?filter=&page=1&per_page=10&status=accepted").reply(200, devices);
    mockDevices.onGet("http://localhost:3000/api/stats").reply(200, stats);

    store.commit("auth/authSuccess", authData);
    store.commit("namespaces/setNamespace", namespaceData);
    store.commit("billing/setSubscription", billingData);
    store.commit("customer/setCustomer", customerData);
    store.commit("devices/setDeviceChooserStatus", true);

    wrapper = mount(DeviceIcon, {
      global: {
        plugins: [[store, key], vuetify, router, SnackbarPlugin],
      },
      props: {
        icon: "",
      },
    });
  });

  it("Is a Vue instance", () => {
    expect(wrapper.vm).toBeTruthy();
  });

  it("Renders the component", () => {
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Renders the component", () => {
    expect(wrapper.find('[data-test="type-icon"]').exists()).toBe(true);
  });

  it("Renders the default icon when no icon prop is provided", () => {
    expect(wrapper.find('[data-test="type-icon"]').classes()).toContain("fl-tux");
  });

  it("Renders a specific icon based on the icon prop", async () => {
    const iconProp = "ubuntu";
    const expectedIconClass = "fl-ubuntu";

    await wrapper.setProps({ icon: iconProp });

    expect(wrapper.find('[data-test="type-icon"]').classes()).toContain(expectedIconClass);
  });

  it("Renders the default icon when an unknown icon prop is provided", async () => {
    const unknownIconProp = "unknown-icon";
    const defaultIconClass = "fl-tux";

    await wrapper.setProps({ icon: unknownIconProp });

    expect(wrapper.find('[data-test="type-icon"]').classes()).toContain(defaultIconClass);
  });
});
