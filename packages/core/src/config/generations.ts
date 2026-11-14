// GENERATED — do not edit.
// Source: 08-tech/config/generations.json
// Regenerate: pnpm --filter @pingus/core sync:config

export default {
  "name": "PINGUS2 Generation State Machine",
  "version": "0.2",
  "principle": "Traits are fixed at birth. Generation is earned. Money buys the outfit, doing buys the state.",
  "thresholds_locked": false,
  "_warning": "Thresholds are PROPOSALS. Lock before mint. Never change after mint.",
  "generations": [
    {
      "gen": 0,
      "key": "HIELO",
      "label": "0 — HIELO",
      "word": "NACE",
      "calor_min": 0,
      "calor_max": 2,
      "can_breed": false,
      "can_claim": false,
      "colors": 4,
      "estados": [
        {
          "key": "HIELO_SOLIDO",
          "calor": [
            0,
            0
          ],
          "change": "pristine cube, no marks"
        },
        {
          "key": "HIELO_SUDADO",
          "calor": [
            1,
            1
          ],
          "change": "condensation beads, wet ring beneath"
        },
        {
          "key": "HIELO_TENSO",
          "calor": [
            2,
            2
          ],
          "change": "one new internal fracture"
        }
      ]
    },
    {
      "gen": 1,
      "key": "DESHIELO",
      "label": "1 — DESHIELO",
      "word": "CALIENTA",
      "calor_min": 3,
      "calor_max": 7,
      "can_breed": false,
      "can_claim": false,
      "sizing_opens": true,
      "colors": 4,
      "estados": [
        {
          "key": "GRIETA",
          "calor": [
            3,
            3
          ],
          "change": "one hairline fracture"
        },
        {
          "key": "ESQUINA_IDA",
          "calor": [
            4,
            5
          ],
          "change": "a corner has broken off, lies beside the cube"
        },
        {
          "key": "MEDIO_LIBRE",
          "calor": [
            6,
            7
          ],
          "change": "upper body out, lower half still encased"
        }
      ]
    },
    {
      "gen": 2,
      "key": "CORRIENTE",
      "label": "2 — CORRIENTE",
      "word": "HACE",
      "calor_min": 8,
      "calor_max": 14,
      "can_breed": true,
      "can_claim": true,
      "colors": [
        3,
        4
      ],
      "hero_generation": true,
      "notes": "Only generation with real movement. Only generation that can breed. FIT fully visible here.",
      "estados": [
        {
          "key": "CORRIENTE_BAJA",
          "calor": [
            8,
            9
          ],
          "change": "standing in still water"
        },
        {
          "key": "CORRIENTE_MEDIA",
          "calor": [
            10,
            12
          ],
          "change": "water moving, directional, mid-stride"
        },
        {
          "key": "CORRIENTE_ALTA",
          "calor": [
            13,
            14
          ],
          "change": "steam at the edges, transition warning"
        }
      ]
    },
    {
      "gen": 3,
      "key": "VAPOR",
      "label": "3 — VAPOR",
      "word": "HECHO",
      "calor_min": 15,
      "calor_max": null,
      "can_breed": false,
      "can_claim": false,
      "colors": 2,
      "terminal": true,
      "notes": "MUST read as completion, never death. Face always readable. Everything rises.",
      "estados": [
        {
          "key": "VAPOR_BAJO",
          "calor": [
            15,
            17
          ],
          "change": "feet gone, body translucent"
        },
        {
          "key": "VAPOR_ALTO",
          "calor": [
            18,
            20
          ],
          "change": "only chest and head remain"
        },
        {
          "key": "HECHO",
          "calor": [
            21,
            null
          ],
          "change": "faintest line, face still readable",
          "terminal": true
        }
      ]
    }
  ],
  "hechos": {
    "cooldown_days": 14,
    "catalogue": [
      {
        "key": "PRIMER_DESHIELO",
        "peso": 1,
        "verification": "automated",
        "desc": "claim your pingu and set a public intent"
      },
      {
        "key": "PRESENTADO",
        "peso": 1,
        "verification": "manual",
        "once": true,
        "desc": "introduce yourself and what you do"
      },
      {
        "key": "ETIQUETADO",
        "peso": 1,
        "verification": "semi-automated",
        "desc": "pingu is your public avatar for 30 days"
      },
      {
        "key": "ENCUENTRO",
        "peso": 2,
        "verification": "on-chain",
        "desc": "breed with another pingu (GEN 2 only)"
      },
      {
        "key": "COLABORA",
        "peso": 2,
        "verification": "manual",
        "desc": "make something with another holder"
      },
      {
        "key": "TALLER",
        "peso": 2,
        "verification": "checkin",
        "desc": "attend a donedone.io workshop or IRL event"
      },
      {
        "key": "VESTIDO",
        "peso": 2,
        "verification": "manual",
        "desc": "wear a claimed garment in public, documented"
      },
      {
        "key": "OBRA_ENTREGADA",
        "peso": 3,
        "verification": "manual",
        "desc": "ship a thing you made, publicly"
      },
      {
        "key": "ENSENADO",
        "peso": 3,
        "verification": "manual",
        "desc": "teach a skill to the community, documented"
      },
      {
        "key": "TRAIDO",
        "peso": 3,
        "verification": "semi-automated",
        "desc": "bring in a doer who completes a hecho"
      },
      {
        "key": "OBRA_MAYOR",
        "peso": 5,
        "verification": "council",
        "desc": "significant body of work, reviewed"
      },
      {
        "key": "CICLO",
        "peso": 5,
        "verification": "automated",
        "desc": "take a pingu all the way to VAPOR"
      }
    ],
    "never_a_hecho": [
      "buying anything at any price",
      "holding for any duration",
      "joining a discord",
      "owning multiple pingus",
      "liking / retweeting / following",
      "referring someone who does nothing"
    ]
  },
  "transfer_policy": {
    "model": "C",
    "calor_transfers": true,
    "hechos_attributed_to_original_wallet": true,
    "rationale": "You can buy a finished pingu. You cannot buy having finished it."
  }
} as const;
