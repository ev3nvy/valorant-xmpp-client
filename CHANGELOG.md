# Change Log
All notable changes to this project will be documented in this file.

## [1.0.0-test.2] - 2022-03-04

Small update that fixes major issues.

### Added
   
### Changed
- Static variables/methods have been removed
    - frankly, they were a waste of time and uncessary
- Main class now extends the EventEmitter class
    - no longer required to keep track of an EventEmitter instance
    - adds intellisense

### Fixed
- Examples should now work
- No longer randomly crashes when fetching friends list
- Fix default interval between emitting presences

<details>
<summary>[1.0.0-test.1] - 2022-03-04</summary>

## [1.0.0-test.1] - 2022-03-04

### Added
- Authorization is 95% complete
    - reauth is not a thing yet
    - failing 2fa is not properly checked
- XMPP client is 90% complete
    - not all error checks are implemented
    - error checks that are implemented use a generic Error object
- Valorant XMPP client is 60% complete
    - presences
        - main xml object is formatted
        - valorant presences are formatted
        - builder for the main xml object should be complete
        - builder for the keystone object should be complete
        - builder for the valorant object should be complete
    - messages
        - sending not implemented
        - received messages are an entire xml object and not formatted at all
    - friends
        - fetching the friends list should be working
        - updating (e.g. sending friend requests) doesn't update the array
        - roster event should be properly emitted
- Errors are 30% implemented
    - auth errors should be mostly complete
    - other errors not implementd
- Logger is 0% complete
    - I only made the file and moved on OMEGALUL
   
### Changed
Nothing - first release
### Fixed
Nothing - first release
</details>