<template>
  <div class="settings-root">
    <div class="scroll-outer custom-scroll">
      <div class="settings-container">
        <div class="row q-col-gutter-lg items-start">
          <div class="col-12 col-md-4">
            <div class="column q-gutter-md">
              <q-card class="round-card">
                <q-card-section class="flex column items-center q-gutter-md compact-section">
                  <q-avatar size="140px">
                    <img src="https://cdn.quasar.dev/img/avatar4.jpg" alt="avatar" />
                  </q-avatar>

                  <div class="text-h5 text-center">Eren Yager</div>

                  <q-chip color="positive" text-color="white" dense square>ONLINE</q-chip>

                  <div class="q-mt-sm q-pa-sm self-stretch text-center bg-grey-1 rounded-borders">
                    <div class="text-caption text-grey-7">Email</div>
                    <div class="text-body2">eren.yager@gmail.com</div>
                    <div class="q-mt-sm text-caption text-grey-7">Nickname</div>
                    <div class="text-body2">@erenY22</div>
                  </div>

                  <div class="q-mt-sm column q-gutter-sm self-stretch">
                    <q-btn flat icon="visibility" label="Public profile" color="primary" />
                    <q-btn flat icon="photo_camera" label="Change photo" color="primary" />
                  </div>
                </q-card-section>
              </q-card>

              <q-card class="round-card">
                <q-card-section class="flex column items-center q-gutter-md compact-section">
                  <div class="text-subtitle1 text-weight-medium">Account</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="compact-section">
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-md-6"><q-input dense outlined label="First Name" :model-value="'Eren'"/></div>
                    <div class="col-12 col-md-6"><q-input dense outlined label="Last Name" :model-value="'Yager'"/></div>
                    <div class="col-12 col-md-6"><q-input dense outlined label="Nickname" prefix="@" :model-value="'errenY22'"/></div>
                    <div class="col-12 col-md-6"><q-input dense outlined label="Gmail" type="email" :model-value="'eren.yager@gmail.com'"/></div>
                    <div class="col-12 col-md-6"><q-input dense outlined label="Password" type="password" :model-value="'smrtitanom'"/></div>
                  </div>

                  <div class="row justify-end q-gutter-sm q-mt-sm">
                    <q-btn flat label="Cancel" color="grey-8"/>
                    <q-btn unelevated label="Save" color="primary"/>
                  </div>
                </q-card-section>
              </q-card>

              <q-btn
                class="q-mt-sm"
                color="negative"
                unelevated
                no-caps
                icon="meeting_room"
                label="Logout"
                to="/"
              />
            </div>
          </div>

          <div class="col-12 col-md-8">
            <div class="column q-gutter-md">

              <q-card class="round-card">
                <q-card-section class="compact-section">
                  <div class="status-row">
                    <div class="text-subtitle1 col-title">Presence & Notifications</div>
                    <q-select
                      dense outlined
                      class="status-select"
                      label="Status"
                      :model-value="'ONLINE'"
                      :options="['ONLINE', 'DND 1', 'DND 2', 'OFFLINE']"
                    />
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-md compact-section">
                  <div class="row items-center q-gutter-md">
                    <q-toggle :model-value="true" label="Povoliť notifikácie"/>
                    <q-toggle :model-value="true" label="Len @mentions"/>
                    <q-toggle :model-value="true" label="Stlmiť v DND"/>
                  </div>
                </q-card-section>
              </q-card>

              <q-card class="round-card">
                <q-card-section class="text-subtitle1 compact-section">Privacy & Typing</q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-md compact-section">
                  <q-toggle :model-value="true" label="Zobrazovať ostatným, že píšem"/>
                  <q-toggle :model-value="true" label="Zdieľať náhľad rozpísanej správy"/>
                </q-card-section>
              </q-card>

              <q-card class="round-card">
                <q-card-section class="text-subtitle1 compact-section">My channels</q-card-section>
                <q-separator />
                <q-list separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label>#general</q-item-label>
                      <q-item-label caption class="text-caption">Public • Active</q-item-label>
                    </q-item-section>
                    <q-item-section side class="row q-gutter-sm">
                      <q-btn dense flat icon="logout" label="Leave" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>#devs</q-item-label>
                      <q-item-label caption class="text-caption">
                        Private • Active
                        <q-badge color="purple" class="q-ml-sm">Admin</q-badge>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side class="row q-gutter-sm">
                      <q-btn dense flat icon="logout" label="Leave"/>
                      <q-btn dense flat icon="delete" color="negative" label="Delete channel"/>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <q-card class="round-card">
                <q-expansion-item dense-expand label="Command quick help" expand-icon="expand_more">
                  <q-separator />
                  <q-card-section class="q-gutter-xs compact-section text-body2">
                    <div><code>/join channelName [private]</code> – pridať sa / vytvoriť kanál</div>
                    <div><code>/invite nickName</code> – pozvať používateľa</div>
                    <div><code>/revoke nickName</code> – odobrať používateľovi prístup (private)</div>
                    <div><code>/kick nickName</code> – vyhodiť člena</div>
                    <div><code>/quit</code> – správca zruší kanál</div>
                    <div><code>/cancel</code> – opustiť kanál</div>
                    <div><code>/list</code> – zoznam členov kanála</div>
                    <div><code>/change_channel_visibility</code> zmeň kanál z private na public a naopak</div>
                    <div><code>@nickname</code> – adresovať správu konkrétnemu používateľovi</div>
                  </q-card-section>
                </q-expansion-item>
              </q-card>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.round-card { border-radius: 16px; }
.compact-section { padding: 16px; }

.settings-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.scroll-outer {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-block: 12px;
}

.settings-container {
  width: 100%;
  --page-gutter: clamp(12px, 3vw, 32px);
  padding-inline: var(--page-gutter);
  padding-block: 8px;
}

.custom-scroll { scrollbar-width: none; }
.custom-scroll::-webkit-scrollbar { display: none; }

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.col-title { flex: 1 1 auto; min-width: 200px; }
.status-select { flex: 0 0 180px; }

@media (max-width: 600px) {
  .status-select { flex-basis: 100%; }
}
</style>
