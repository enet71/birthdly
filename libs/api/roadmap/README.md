# api-roadmap

The public roadmap page's items: what is in progress, what is planned and what was released.

| Request                          | Who    | Answer                                                                                        |
| -------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `GET /api/roadmap?locale=<code>` | anyone | `RoadmapResponse`: in progress and planned in `sort_order`, then released items, newest first |

The items live in the `roadmap_items` table with their texts per language; a text without a translation comes in
English. Until an admin page exists, migrations add and change the items.
