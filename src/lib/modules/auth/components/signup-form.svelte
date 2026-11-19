<script lang="ts">
  import { Text } from "$lib/shared/components/text";
  import { Button } from "$lib/shared/components/button";
  import { Field } from "$lib/shared/components/field";
  import { Input } from "$lib/shared/components/input";
  import { authModel } from "../model";

  const {
    registerRequested,
    signupFormPatched,
    $signupForm: form,
    $registerPending: busy,
    $registerErr: err,
  } = authModel;
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    registerRequested();
  }}
>
  <Field label="Full Name">
    <Input
      type="text"
      placeholder="John Doe"
      required
      autocomplete="name"
      value={$form.name}
      onInput={(name) => signupFormPatched({ name })}
    />
  </Field>
  <Field label="Email">
    <Input
      type="email"
      placeholder="m@example.com"
      required
      autocomplete="email"
      value={$form.email}
      onInput={(email) => signupFormPatched({ email })}
    />
  </Field>
  <Field label="Password" hint="Must be at least 8 characters long.">
    <Input
      type="password"
      required
      minlength={8}
      autocomplete="new-password"
      value={$form.password}
      onInput={(password) => signupFormPatched({ password })}
    />
  </Field>
  <Field label="Confirm Password">
    <Input
      type="password"
      required
      minlength={8}
      autocomplete="new-password"
      value={$form.confirm}
      onInput={(confirm) => signupFormPatched({ confirm })}
    />
  </Field>
  {#if $err}
    <Text as="p" variant="caption" tone="error">{$err}</Text>
  {/if}
  <Button type="submit" kind="primary" disabled={$busy}>Create Account</Button>
  <p class="link type-caption">Already have an account? <a href="/login">Sign in</a></p>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .link {
    margin: 0;
    text-align: center;
    color: oklch(from var(--color-text) l c h / 55%);

    a {
      color: var(--color-accent);
    }
  }
</style>
