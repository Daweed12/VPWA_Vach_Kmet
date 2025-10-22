<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- ĽAVO: profilová kartička (statická) -->
      <div class="col-12 col-md-3">
        <q-card class="profile-card">
          <q-card-section class="flex column items-center q-gutter-sm">
            <q-avatar size="96px">
              <!-- statický avatar; ak nechceš obrázok, vymaž <img> -->
              <img src="https://i.pravatar.cc/192?img=5" alt="avatar" />
            </q-avatar>

            <div class="text-h6 text-center">Emily Clark</div>
            <div class="text-caption text-grey-7">@johnny</div>

            <q-chip color="positive" text-color="white" dense square>
              ONLINE
            </q-chip>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-xs">
            <div class="row items-center justify-between">
              <div class="text-caption text-grey-7">Email</div>
              <div class="text-body2">john.doe@gmail.com</div>
            </div>
            <div class="row items-center justify-between">
              <div class="text-caption text-grey-7">Nickname</div>
              <div class="text-body2">@johnny</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="around">
            <q-btn flat icon="visibility" label="Public profile" disable />
            <q-btn flat icon="photo_camera" label="Change photo" disable />
          </q-card-actions>
        </q-card>
      </div>

      <!-- PRAVO: jednoduchý formulár (statické hodnoty, read-only) -->
      <div class="col-12 col-md-9">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">Account</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  dense outlined
                  label="First Name"
                  :model-value="'John'"
                  readonly
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  dense outlined
                  label="Last Name"
                  :model-value="'Doe'"
                  readonly
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  dense outlined
                  label="Nickname"
                  prefix="@"
                  :model-value="'johnny'"
                  readonly
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  dense outlined
                  label="Gmail"
                  type="email"
                  :model-value="'john.doe@gmail.com'"
                  readonly
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  dense outlined
                  label="Password"
                  type="password"
                  :model-value="'password123'"
                  readonly
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  dense outlined
                  label="Status"
                  :model-value="'ONLINE'"
                  :options="['ONLINE', 'DND 1', 'DND 2', 'OFFLINE']"
                  disable
                />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancel" color="grey-8" disable />
              <q-btn unelevated label="Save" color="primary" disable />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  border-radius: 14px;
}
</style>
