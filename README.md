# n8n-nodes-lens

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Lens Protocol** - the decentralized social graph protocol. This node enables full interaction with Lens Protocol's GraphQL API, supporting profiles, publications, follows, reactions, collects, feeds, groups, and more.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Lens Protocol](https://img.shields.io/badge/Lens-Protocol-green)

## Features

- **14 Resource Categories** - Comprehensive coverage of Lens Protocol functionality
- **60+ Operations** - Full CRUD operations for all major features
- **Poll-Based Triggers** - React to new followers, publications, reactions, and more
- **GraphQL Integration** - Native support for Lens Protocol's GraphQL API
- **Authentication Support** - Challenge-response authentication flow
- **Network Selection** - Support for mainnet and testnet environments
- **Simplified Output** - Option to return clean, simplified data structures

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Select **Install**
4. Enter `n8n-nodes-lens` and confirm
5. Restart n8n when prompted

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-lens

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-lens.git
cd n8n-nodes-lens

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n (Linux/macOS)
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-lens

# Restart n8n
```

## Credentials Setup

Create Lens API credentials in n8n:

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet or Testnet | Yes |
| API Endpoint | GraphQL endpoint URL (auto-filled based on network) | Yes |
| Access Token | JWT token for authenticated operations | No |
| Refresh Token | Token for refreshing access | No |
| Profile ID | Your Lens profile ID (hex format, e.g., 0x01) | No |

### Getting Access Tokens

1. Use the **Authentication** resource with the **Challenge** operation to get a challenge
2. Sign the challenge with your Ethereum wallet (EIP-712)
3. Use the **Authenticate** operation with the signed message to receive tokens
4. Store the tokens in your credentials

## Resources & Operations

### Profiles
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Profile by ID | Fetch profile by hex ID | No |
| Get Profile by Handle | Lookup by username (lens/alice) | No |
| Get Profile by Address | Find profile by wallet | No |
| Get Default Profile | Get primary profile for address | No |
| Search Profiles | Find profiles by query | No |
| Get Profile Stats | Get followers/posts statistics | No |
| Explore Profiles | Discover profiles by criteria | No |
| Get Recommended Profiles | Get follow suggestions | No |

### Publications
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Publication | Get single post/comment/mirror/quote | No |
| Get Publications | Get multiple publications | No |
| Create Post | Create new publication | Yes |
| Create Comment | Reply to publication | Yes |
| Create Mirror | Repost/share publication | Yes |
| Create Quote | Quote publication | Yes |
| Delete Publication | Remove publication | Yes |
| Hide Publication | Hide from feed | Yes |

### Follows
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Followers | Get profile followers | No |
| Get Following | Get profiles followed | No |
| Follow Profile | Create follow | Yes |
| Unfollow Profile | Remove follow | Yes |
| Check Follow Status | Check if following | No |
| Get Mutual Follows | Get mutual connections | No |
| Get Follow Module | Get follow rules/requirements | No |

### Reactions
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Reactions | Get publication reactions | No |
| Add Reaction | Like/upvote | Yes |
| Remove Reaction | Unlike | Yes |
| Get Reaction Count | Get reaction statistics | No |
| Check Reacted | Check if user reacted | No |

### Collects
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Collects | Get collection history | No |
| Collect Publication | Mint collect NFT | Yes |
| Get Collect Module | Get collect rules | No |
| Get Collectors | Get list of collectors | No |
| Get Revenue | Get collect earnings | No |

### Feeds
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Feed | Get personalized feed | No |
| Get Highlights | Get top posts | No |
| Get Explore Feed | Get discovery feed | No |
| Get Profile Feed | Get user's publications | No |
| Get Comment Feed | Get replies to publication | No |

### Groups
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Group | Get group details | No |
| List Groups | List available groups | No |
| Join Group | Become member | Yes |
| Leave Group | Exit group | Yes |
| Get Group Members | Get member list | No |
| Get Group Feed | Get group posts | No |

### Authentication
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Challenge | Get auth challenge | No |
| Authenticate | Sign and get tokens | No |
| Refresh Token | Renew access token | No |
| Verify Token | Check token validity | No |
| Revoke Token | Invalidate token | Yes |

### Notifications
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Notifications | Get user alerts | Yes |
| Get Mention Notifications | Get mentions | Yes |
| Get Follow Notifications | Get new followers | Yes |
| Get Reaction Notifications | Get likes | Yes |
| Mark as Read | Clear notifications | Yes |

### Modules
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Currencies | Get supported tokens | No |
| Get Follow Modules | Get follow module options | No |
| Get Open Action Modules | Get custom action modules | No |
| Get Reference Modules | Get comment/mirror rules | No |
| Get Enabled Modules | Get all active modules | No |

### Search
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Search Profiles | Find users by query | No |
| Search Publications | Find posts by query | No |
| Search All | Search both types | No |
| Get Trending Tags | Get popular hashtags | No |

### Metadata
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Create Publication Metadata | Generate post metadata JSON | No |
| Create Profile Metadata | Generate profile metadata JSON | No |
| Validate Publication Metadata | Verify metadata format | No |
| Set Profile Metadata | Update profile on-chain | Yes |

### Revenue
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Get Profile Revenue | Get total earnings | No |
| Get Publication Revenue | Get post earnings | No |
| Get Follow Revenue | Get follow fee earnings | No |
| Get Revenue Summary | Get comprehensive summary | No |

### Utility
| Operation | Description | Auth Required |
|-----------|-------------|---------------|
| Check API Health | Check if API is healthy | No |
| Get Currencies | Get supported currencies | No |
| Get Managed Profiles | Get profiles for wallet | No |
| Validate Handle | Check handle availability | No |
| Get Protocol Stats | Get Lens statistics | No |

## Trigger Node

The **Lens Trigger** node polls for events and triggers workflows when:

| Event | Description |
|-------|-------------|
| New Follower | Profile receives a new follower |
| New Publication | Profile creates a new post/comment/mirror |
| New Comment | Publication receives a new comment |
| Publication Collected | Publication is collected/minted |
| Profile Mentioned | Profile is mentioned in a post |
| New Reaction | Publication receives a like |
| New Notification | Any new notification arrives |

## Usage Examples

### Get Profile Information

```javascript
// Node configuration
{
  "resource": "profiles",
  "operation": "getProfileByHandle",
  "handle": "lens/alice"
}
```

### Create a Post

```javascript
// Node configuration (requires authentication)
{
  "resource": "publications",
  "operation": "createPost",
  "content": "Hello from n8n! 🌿",
  "contentType": "TEXT_ONLY",
  "tags": "n8n, automation, web3"
}
```

### Search Publications

```javascript
// Node configuration
{
  "resource": "search",
  "operation": "searchPublications",
  "query": "web3 development",
  "limit": 10
}
```

### Monitor New Followers

```javascript
// Trigger node configuration
{
  "event": "newFollower",
  "profileId": "0x01"
}
```

## Lens Protocol Concepts

| Concept | Description |
|---------|-------------|
| Profile NFT | Unique identity token on Lens |
| Handle | Username with namespace (lens/alice) |
| Publication | Post, comment, mirror, or quote |
| Follow NFT | Token received when following a profile |
| Collect NFT | Token minted when collecting publication |
| Module | Customizable logic for follow/collect/reference |
| Open Action | Custom publication interactions |
| Reference Module | Rules for comments and mirrors |
| Lens Chain | Protocol's own L2 blockchain (V3) |

## Networks

| Network | API Endpoint | Chain |
|---------|--------------|-------|
| Mainnet | https://api.lens.xyz/graphql | Lens Chain |
| Testnet | https://api-v2-amoy.lens.dev/graphql | Amoy |

## Error Handling

The node handles common errors gracefully:

- **Authentication errors**: Clear message about missing or invalid tokens
- **Rate limiting**: Automatic retry with backoff (where possible)
- **GraphQL errors**: Parsed and returned with actionable messages
- **Network errors**: Timeout and connection error handling

Use the **Continue on Fail** option to handle errors in your workflow without stopping execution.

## Security Best Practices

1. **Never share access tokens** - Store credentials securely in n8n
2. **Use testnet first** - Test workflows on Amoy testnet before mainnet
3. **Rotate tokens regularly** - Use refresh tokens to get new access tokens
4. **Limit token scope** - Only request necessary permissions
5. **Monitor usage** - Watch for unexpected API calls or errors

## Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Watch for changes during development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your PR:
- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed

## Support

- **Documentation**: [Lens Protocol Docs](https://docs.lens.xyz/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-lens/issues)
- **Discord**: [Lens Protocol Discord](https://discord.gg/lens)

## Acknowledgments

- [Lens Protocol](https://lens.xyz/) - The decentralized social graph
- [n8n](https://n8n.io/) - Workflow automation platform
- [Velocity BPA](https://velobpa.com) - Node development and maintenance
