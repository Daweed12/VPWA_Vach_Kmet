<template>
  <div class="q-pa-md profile-wrapper no-page-scroll">
    <div class="row q-col-gutter-md items-start settings-row">

      <!-- ĽAVÁ STRANA: profil + ACCOUNT -->
      <div class="col-12 col-md-4 flex column q-gutter-md column-fixed">
        <!-- PROFIL -->
        <q-card class="round-card">
          <q-card-section class="flex column items-center q-gutter-md compact-section">
            <q-avatar size="140px">
              <img src="https://i.pravatar.cc/192?img=5" alt="avatar" />
            </q-avatar>

            <div class="text-h5 text-center">Emily Clark</div>
            <div class="text-caption text-grey-7">@johnny</div>

            <q-chip color="positive" text-color="white" dense square>
              ONLINE
            </q-chip>

            <div class="q-mt-sm q-pa-sm self-stretch text-center bg-grey-1 rounded-borders">
              <div class="text-caption text-grey-7">Email</div>
              <div class="text-body2">john.doe@gmail.com</div>
              <div class="q-mt-sm text-caption text-grey-7">Nickname</div>
              <div class="text-body2">@johnny</div>
            </div>

            <div class="q-mt-sm row justify-around full-width">
              <q-btn flat icon="visibility" label="Public profile" color="primary"/>
              <q-btn flat icon="photo_camera" label="Change photo" color="primary"/>
            </div>
          </q-card-section>
        </q-card>

        <!-- ACCOUNT -->
        <q-card class="round-card">
          <q-card-section class="flex column items-center q-gutter-md compact-section">
            <div class="text-subtitle1 text-weight-medium">Account</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="compact-section">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <q-input dense outlined label="First Name" :model-value="'John'"/>
              </div>
              <div class="col-12 col-md-6">
                <q-input dense outlined label="Last Name" :model-value="'Doe'"/>
              </div>
              <div class="col-12 col-md-6">
                <q-input dense outlined label="Nickname" prefix="@" :model-value="'johnny'"/>
              </div>
              <div class="col-12 col-md-6">
                <q-input dense outlined label="Gmail" type="email" :model-value="'john.doe@gmail.com'"/>
              </div>
              <div class="col-12 col-md-6">
                <q-input dense outlined label="Password" type="password" :model-value="'password123'"/>
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-sm">
              <q-btn flat label="Cancel" color="grey-8"/>
              <q-btn unelevated label="Save" color="primary"/>
            </div>
          </q-card-section>
        </q-card>

        <!-- NOVÝ BUTTON DOLE -->
        <q-btn
          class="logout-btn q-mt-sm"
          color="negative"
          unelevated
          no-caps
          icon="meeting_room"
          label="Logout"
          to="/#"
        />
      </div>

      <!-- PRAVÁ STRANA -->
      <div class="col-12 col-md-8 flex column q-gutter-md column-fixed">
        <!-- PRESENCE & NOTIFICATIONS -->
        <q-card class="round-card">
          <q-card-section class="row items-center justify-between compact-section">
            <div class="text-subtitle1">Presence & Notifications</div>
            <q-select
              dense outlined
              style="min-width: 180px"
              label="Status"
              :model-value="'ONLINE'"
              :options="['ONLINE', 'DND 1', 'DND 2', 'OFFLINE']"
            />
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

        <!-- PRIVACY & TYPING -->
        <q-card class="round-card">
          <q-card-section class="text-subtitle1 compact-section">Privacy & Typing</q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md compact-section">
            <q-toggle :model-value="true" label="Zobrazovať ostatným, že píšem"/>
            <q-toggle :model-value="true" label="Zdieľať náhľad rozpísanej správy"/>
          </q-card-section>
        </q-card>

        <!-- MY CHANNELS -->
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

        <!-- COMMANDS QUICK HELP -->
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
</template>




<style scoped>

</style>
<script setup lang="ts">
</script>
