# Super Trunfo Forza Horizon MVP Design

## Goal

Build a public web MVP of a two-player online Super Trunfo-style card game based on cars from the Forza Horizon Wiki/Fandom pages. The MVP should be playable online through a host-created room code/link, use a complete curated card dataset from the provided Forza Horizon sources, and present cards with a premium game UI style inspired by the classic physical Super Trunfo format.

The project is personal/portfolio, low traffic, and non-monetized.

## Source Pages

- https://forza.fandom.com/wiki/Forza_Horizon/Cars
- https://forza.fandom.com/wiki/Forza_Horizon_2/Cars
- https://forza.fandom.com/wiki/Forza_Horizon_3/Cars
- https://forza.fandom.com/wiki/Forza_Horizon_4/Cars
- https://forza.fandom.com/wiki/Forza_Horizon_5/Cars
- https://forza.fandom.com/wiki/Forza_Horizon_6/Cars

Forza Horizon 6 should be attempted, but only complete cars are eligible for play.

## Product Scope

The MVP is a two-player online game:

- No accounts.
- No chat.
- No spectators.
- Players use temporary nicknames.
- Host creates a room and receives a 4-digit room code/link.
- Guest joins by the same 4-digit code/link.
- Host configures deck size and starts the match.
- The app supports PT-BR and English, with a visible per-player language selector.

The MVP does not include a standalone card catalog outside a match.

## Room And Lobby Rules

Room codes are 4 digits. If an active room already uses a generated code, the app automatically generates another code. The URL uses the same 4-digit code.

This is acceptable for the MVP despite being guessable because the project is casual, personal, and has no persistent sensitive match history.

Players only occupy a room slot after entering a valid nickname. Nicknames:

- Must be 2 to 16 characters.
- Must be sanitized.
- Must not allow HTML.
- Cannot be edited after joining.

If two guests try to join at the same time, the first guest gets the slot and the others see that the room is full. The host may kick the guest before the match starts. Kicking the guest keeps the same room code/link and reopens the guest slot.

The lobby includes a short "how to play" modal. The modal explains the Super Trunfo rule, but does not list which cars are Super Trunfos.

## Deck Setup

The host chooses the deck size before starting. The UI shows the maximum number of complete cards available and allows the host to choose any even number less than or equal to that maximum, including an option to use all cards.

Odd deck sizes are not allowed. The deck is shuffled and split evenly between the two players. The first player to choose an attribute is selected randomly.

## Match Rules

Each player sees only their own card before the attribute is chosen. The opponent's card is revealed after the active player chooses an attribute.

Comparable attributes:

- `SP` speed
- `HA` handling
- `AC` acceleration
- `LS` launch
- `BR` braking

All comparable attributes use "higher value wins". `PL` is displayed on the card and is required for a card to exist, but it is never selectable or comparable during a round.

Round flow:

1. The active player chooses one comparable attribute from their current card.
2. Both cards are revealed.
3. The higher value wins the round.
4. The winner receives all cards in dispute.
5. Won cards go to the bottom of the winner's deck in shuffled order.
6. The winner chooses the next round's attribute.

On attribute tie:

- Cards in dispute accumulate.
- No one receives cards yet.
- The same active player keeps the next attribute choice.
- The next winner receives the accumulated pile.

After a reveal, any player may advance to the next round manually.

The match ends when one player has no cards. The other player wins.

## Super Trunfo Cards

There is one Super Trunfo card per Forza Horizon game, based on a fixed list of the main car from the standard cover art for each game. The initial list should be researched during the data-import work and reviewed before being finalized.

Super Trunfo rules:

- A Super Trunfo beats any common card regardless of selected attribute values.
- Super Trunfo versus Super Trunfo compares normally using the selected attribute.
- If a Super Trunfo loses to another Super Trunfo, it is won like any other card.
- If a required Super Trunfo is incomplete during import, the import fails until corrected.

Super Trunfo visual treatment:

- Badge reading "SUPER TRUNFO".
- Gold border.
- Moderate holographic or animated premium effect.
- Visual treatment should be stronger than normal class/PI tiers, but not visually noisy.

## Early Termination And Rematch

The match is classical and can continue until one player runs out of cards. There is no automatic round or time limit.

Both players always see a button to request early match termination. The button toggles between request and cancel. If both players have requested termination at the same time, the match ends by mutual agreement:

- The player with more cards wins.
- If both players have the same number of cards, the match ends in a final draw.

After a completed match, the result screen allows a rematch in the same room with a new shuffle.

## Disconnection

Both players, including the host, have a 2-minute reconnection window. If a player does not return within 2 minutes, they lose by abandonment.

Because the host client is the match authority in the MVP, if the host disconnects the game waits for the same 2-minute reconnection window before resolving abandonment.

## Data Model And Import

The project uses a versioned dataset in the repository plus synchronization to Supabase.

The scraper/importer is a separate development tool run manually. It should not run inside the production app and should not be required for users to play.

Import behavior:

- Visit the provided Forza Horizon car list pages.
- Follow each listed car's individual page.
- Use the individual page thumb/infobox image as the card image.
- Prefer the list/game source for game-specific stats.
- Prefer the individual page thumb/infobox for image and metadata when available.
- Deduplicate cars by exact normalized name.
- Preserve variants with different names, such as Gymkhana, Forza Edition, Welcome Pack, and similar special variants.
- If the same normalized car appears in multiple games, use the data from the newest Forza Horizon game.
- Save the individual car page URL and original image URL in the dataset for traceability, but do not show them in the app.

Only complete cars are eligible for play. A complete car requires:

- Name.
- Image from the individual page thumb/infobox.
- Manufacturer.
- Year.
- Class/PI as `PL` in an expected format such as `S1 900`.
- `SP`, `HA`, `AC`, `LS`, `BR`.
- `PL`.

Data should be normalized to internal typed values while preserving original source text when useful. If `PL` is missing or in an unexpected format, the car is excluded until corrected.

Future scraper runs should generate a report/diff and only apply changes after approval. They should not silently mutate the dataset.

Images should be downloaded and stored in the project and Supabase Storage. The dataset should preserve source references for credit and traceability.

## Technical Architecture

Stack:

- Next.js.
- React.
- TypeScript.
- Vercel for public web deploy.
- Supabase Free for database, storage, and realtime synchronization.

The architecture is hybrid:

- Stable catalog/card/image metadata is normalized.
- Temporary room and match state is synchronized as JSON.

The host client is the authority for MVP match resolution:

- Deck shuffle.
- Round resolution.
- Tie pile handling.
- Super Trunfo logic.
- Abandonment.
- Rematch.
- Mutual termination.

Supabase synchronizes state in realtime. This intentionally accepts a casual-game trade-off: technical users may inspect client data or tamper with state. Strong anti-cheat is out of scope for the MVP.

There is no persistent match history. Rooms are temporary and expire after 6 hours. Cleanup is opportunistic: opening or creating a room triggers removal of expired rooms.

Dataset-to-Supabase synchronization is a local script using service credentials from `.env`. There is no admin UI in the MVP.

## UI Direction

Visual direction: premium collectible game UI.

The interface should be dark, elegant, and energetic enough for a racing game while keeping stats easy to read on desktop and mobile. It should avoid heavy neon or excessive arcade effects.

Card content:

- Large car image.
- Original car name.
- Manufacturer.
- Year.
- Class/PI.
- Stat sigils on the card: `SP`, `HA`, `AC`, `LS`, `BR`, `PL`.
- Full translated attribute names in tooltip/modal.
- Tier visual based on class/PI for common cards.
- Stronger Super Trunfo treatment for special cards.

Desktop match layout can show both player areas, with the current player's own card emphasized and the opponent card hidden until reveal. Mobile match layout prioritizes a large own card, actions below it, and opponent card reveal only after attribute selection.

The game includes:

- Light reveal and round-win animations.
- Simple sound effects.
- Visible mute/unmute button.

## Internationalization

Initial UI language is PT-BR, with a complete English version. Each player can choose language independently with a visible selector.

Car manufacturer/model names are preserved in their original form. Attribute labels use compact sigils on cards, with full names available in translated helper UI.

## Testing

Automated tests should focus on game logic and data import.

Game logic coverage:

- Attribute win.
- Attribute tie and accumulated pile.
- Super Trunfo versus common card.
- Super Trunfo versus Super Trunfo.
- Won cards shuffled to winner deck bottom.
- Winner controls next attribute.
- Same player keeps control after tie.
- Manual next-round advancement.
- Match end when one player runs out of cards.
- Abandonment after 2 minutes.
- Mutual early termination.
- Final draw on equal card count during mutual termination.
- Rematch with new shuffle.
- Even deck-size enforcement.

Import coverage:

- Normalization.
- Exact normalized-name deduplication.
- Preservation of named variants.
- Newest-game data wins for duplicates.
- Rejection of incomplete cars.
- `PL` format validation.
- Required Super Trunfo incompleteness fails import.
- Diff/report generation for future updates.

## Documentation

The project should include README/setup documentation from the MVP:

- Local setup.
- Required `.env` variables.
- Supabase setup.
- Supabase Storage setup.
- Scraper/import workflow.
- Diff/review workflow for scraper updates.
- Dataset-to-Supabase sync.
- Test commands.
- Vercel deploy.
- Notes that images come from Forza Wiki/Fandom and source references are preserved in the dataset.

## Delivery Criteria

The MVP is not complete merely because a mock-data match works. The MVP is complete when:

- The app is publicly deployed.
- Two players can play online via code/link.
- The complete eligible catalog has been imported from the provided Forza Horizon pages.
- Only complete cards are published to play.
- Required Super Trunfo cards are present and valid.
- Card images are stored and served reliably.
- PT-BR and English UI are available.
- Core rules are tested.
- Import validation is tested.
- Setup, import, sync, test, and deploy documentation exists.

