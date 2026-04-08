Create a website to manage song lists for bands. It will have these capabilities:
Add, manage, and delete bands (Bands)
Add, manage, and delete band memers (Musicians)
Add, manage, and delete instruments for each band mamber (Instruments)
Add, manage, and delete songs (Songs)
Create, manage, and delete sets of songs (SetLists)
Create, manage, and delete events (Events)
Create, manage, and delete tours (Tours)
Assign SetLists to Events in a specific order (Set 1, Set 2, ...)
Assign Events to Tours

Models:
Band
- Name
- Musician[]

Song
- Name
- Artist
- Vocalist (Musician[])
- VocalRange (High/Low/[Null])
- Notes
- Link

Musician
- Name
- Phone
- Email
- Bio
- Instrument[]

Instrument
- Name

SetList
- Name
- Song[] <- manually reordered

Event
- Name
- Location
- Date
- Time
- SetList[] <- manually ordered

Tour
- Name
- Event[]

Relationships:
Bands can have multiple Musicians
Musicians can be in multiple Bands
Songs can have multiple vocalists
Musicians can have multiple Instruments
Instruments cna be assigned to multiple Musicians
SetLists can have multiple Songs
Songs can be on multiple SetLists
Events can have multoiple SetLists
SetLists can be on multiple Events
Tours can have multiple Events
Events CANNOT be on multiple Tours

Website functionality:
Basic CRUD for all models
Add/remove as indicated in relationships
All relationships can be copied to another parent OR moved to another parent

Pages:
CRUD and relationship management forms for all entities
Views of all relationships
Views of specific relationships:
Event -> All Songs in order grouped by SetList in order

Environment:
This will be run on a local Windows PC

Tech Stack:
Give recommendations

I would also like any ideas that you have about other useful functionality.